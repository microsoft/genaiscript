import * as vscode from "vscode"
import {
    ChatCompletionsProgressReport,
    CoArchProject,
    Fragment,
    FragmentState,
    PromptTemplate,
    concatArrays,
    parseProject,
    FragmentTransformResponse,
    runTemplate,
    groupBy,
    DiagnosticSeverity,
    promptDefinitions,
} from "coarch-core"
import { ExtensionContext } from "vscode"
import { debounceAsync } from "./debounce"
import { VSCodeHost } from "./vshost"
import { markSyncedFragment } from "coarch-core"
import { toRange } from "./edit"
import { URI, Utils } from "vscode-uri"
import { readFileText, writeFile } from "./fs"

export const CHANGE = "change"
export const FRAGMENTS_CHANGE = "fragmentsChange"
export const AI_REQUEST_CHANGE = "aiRequestChange"

export interface AIRequestOptions {
    label: string
    template: PromptTemplate
    fragments: Fragment[]
}

export interface AIRequestContextOptions {
    ignoreOutput?: boolean
}

export class FragmentsEvent extends Event {
    constructor(readonly fragments?: Fragment[]) {
        super(FRAGMENTS_CHANGE)
    }
}

export interface AIRequest extends AIRequestOptions {
    controller: AbortController
    request?: Promise<FragmentTransformResponse>
    response?: FragmentTransformResponse
    computing?: boolean
    error?: any
    progress?: ChatCompletionsProgressReport
}

export class ExtensionState extends EventTarget {
    readonly host: VSCodeHost
    private _project: CoArchProject = undefined
    private _aiRequest: AIRequest = undefined
    private _watcher: vscode.FileSystemWatcher | undefined
    private _diagColl: vscode.DiagnosticCollection

    readonly aiRequestContext: AIRequestContextOptions = {}

    constructor(public readonly context: ExtensionContext) {
        super()
        this.host = new VSCodeHost(this)
        const { subscriptions } = context
        subscriptions.push(this)

        this._diagColl = vscode.languages.createDiagnosticCollection("CoArch")
        subscriptions.push(this._diagColl)

        // clear errors when file edited (remove me?)
        vscode.workspace.onDidChangeTextDocument(
            (ev) => {
                this._diagColl.set(ev.document.uri, [])
            },
            undefined,
            subscriptions
        )
    }

    startAIRequest(
        options: AIRequestOptions
    ): Promise<FragmentTransformResponse> {
        const controller = new AbortController()
        const signal = controller.signal
        const r: AIRequest = {
            ...options,
            controller,
            request: null,
            computing: true,
        }
        const reqChange = () => {
            if (this._aiRequest === r) {
                this.dispatchEvent(new Event(AI_REQUEST_CHANGE))
                this.dispatchChange()
            }
        }
        const partialCb = (progress: ChatCompletionsProgressReport) => {
            r.progress = progress
            if (r.response) r.response.text = progress.responseSoFar
            reqChange()
        }
        this.aiRequest = r
        r.request = runTemplate(options.template, options.fragments[0], {
            requestOptions: { signal },
            partialCb,
            infoCb: (data) => {
                // TODO this should allow us to look at the trace while AI query is running
                // somehow it doesn't work though (VSCode shows empty preview and doesn't call into the markdown provider)
                r.response = data
                reqChange()
            },
            promptOptions: this.aiRequestContext,
        })
        // clear on completion
        r.request
            .then((resp) => {
                r.response = resp
                r.computing = false
            })
            .catch((e) => {
                r.computing = false
                r.error = e
            })
            .then(reqChange)
        return r?.request
    }

    get aiRequest() {
        return this._aiRequest
    }

    private set aiRequest(r: AIRequest) {
        if (this._aiRequest !== r) {
            this._aiRequest = r
            this.dispatchEvent(new Event(AI_REQUEST_CHANGE))
            this.dispatchChange()
        }
    }

    cancelAiRequest() {
        const a = this.aiRequest
        a?.controller?.abort("user cancelled")
        this.aiRequest = undefined
    }

    get project() {
        return this._project
    }

    get rootFragments() {
        return this._project
            ? concatArrays(...this._project.rootFiles.map((p) => p.roots))
            : []
    }

    async markSyncedFragment(
        fragment: Fragment | Fragment[],
        fragmentState: FragmentState
    ) {
        if (!Array.isArray(fragment)) fragment = [fragment]
        await Promise.all(
            fragment.map((f) => markSyncedFragment(f, fragmentState))
        )
        this.dispatchFragments(fragment)
    }

    private set project(prj: CoArchProject) {
        this._project = prj
        this.dispatchFragments()
    }

    private dispatchChange() {
        this.dispatchEvent(new Event(CHANGE))
    }

    private dispatchFragments(fragments?: Fragment[]) {
        this.dispatchEvent(new FragmentsEvent(fragments))
        this.dispatchChange()
    }

    private initWatcher() {
        const handleChange = debounceAsync(async () => {
            console.log(`coarch: watch changed`)
            await this.fixPromptDefinitions()
            await this.parseWorkspace()
        }, 1000)

        this._watcher = vscode.workspace.createFileSystemWatcher(
            "**/*.{coarch.md,prompt.js}"
        )
        this._watcher.onDidChange(handleChange)
        this._watcher.onDidCreate(handleChange)
        this._watcher.onDidDelete(handleChange)
    }

    async activate() {
        console.log(`coarch: activate`)
        this.initWatcher()
        await this.fixPromptDefinitions()
        await this.parseWorkspace()
    }

    async fixPromptDefinitions() {
        const prompts = await vscode.workspace.findFiles("**/*.prompt.js")
        const folders = new Set(prompts.map((f) => Utils.dirname(f).fsPath))
        for (const folder of folders) {
            const f = vscode.Uri.file(folder)
            for (const [defName, defContent] of Object.entries(
                promptDefinitions
            )) {
                const current = await readFileText(f, defName)
                if (current !== defContent)
                    await writeFile(f, defName, defContent)
            }
        }
    }

    async parseWorkspace() {
        async function findFiles(pattern: string) {
            return (await vscode.workspace.findFiles(pattern)).map(
                (f) => f.fsPath
            )
        }

        const coarchFiles = await findFiles("**/*.coarch.md")
        const promptFiles = await findFiles("**/*.prompt.js")
        const fileTypeFiles = await findFiles("**/*.filetype.js")
        const coarchJsonFiles = await findFiles("**/coarch.json")

        this.project = await parseProject({
            coarchFiles,
            promptFiles,
            fileTypeFiles,
            coarchJsonFiles,
        })

        this.setDiagnostics()
    }

    private setDiagnostics() {
        this._diagColl.clear()

        const severities: Record<
            DiagnosticSeverity,
            vscode.DiagnosticSeverity
        > = {
            warning: vscode.DiagnosticSeverity.Warning,
            error: vscode.DiagnosticSeverity.Error,
            info: vscode.DiagnosticSeverity.Information,
        }

        for (const [filename, diags] of Object.entries(
            groupBy(this.project.diagnostics, (d) => d.filename)
        )) {
            this._diagColl.set(
                vscode.Uri.file(filename),
                diags.map((d) => {
                    const r = new vscode.Diagnostic(
                        toRange(d.range),
                        d.message,
                        severities[d.severity]
                    )
                    r.source = "CoArch"
                    // r.code = 0;
                    return r
                })
            )
        }
    }

    private clear() {
        this._watcher?.dispose()
        this._watcher = undefined
        this.dispatchChange()
    }

    dispose() {
        this.clear()
    }
}
