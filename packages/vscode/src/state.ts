import * as vscode from "vscode"
import {
    ChatCompletionsProgressReport,
    CoArchProject,
    Fragment,
    PromptTemplate,
    concatArrays,
    parseProject,
    FragmentTransformResponse,
    runTemplate,
    groupBy,
    DiagnosticSeverity,
    promptDefinitions,
    RunTemplateOptions,
    isCancelError,
    isTokenError,
    initToken,
    isRequestError,
    delay,
    CHANGE,
    Cache,
} from "coarch-core"
import { ExtensionContext } from "vscode"
import { debounceAsync } from "./debounce"
import { VSCodeHost } from "./vshost"
import { applyEdits, toRange } from "./edit"
import { Utils } from "vscode-uri"
import { readFileText, writeFile } from "./fs"

export const FRAGMENTS_CHANGE = "fragmentsChange"
export const AI_REQUEST_CHANGE = "aiRequestChange"

export const REQUEST_OUTPUT_FILENAME = "CoArch Output.md"
export const REQUEST_TRACE_FILENAME = "CoArch Trace.md"

export async function openRequestOutput() {
    return vscode.commands.executeCommand(
        "coarch.request.open",
        REQUEST_OUTPUT_FILENAME
    )
}

export async function openRequestTrace() {
    return vscode.commands.executeCommand(
        "coarch.request.open",
        REQUEST_TRACE_FILENAME
    )
}

export interface AIRequestOptions {
    label: string
    template: PromptTemplate
    fragment: Fragment
}

export interface AIRequestContextOptions {
    ignoreOutput?: boolean
}

export class FragmentsEvent extends Event {
    constructor(readonly fragments?: Fragment[]) {
        super(FRAGMENTS_CHANGE)
    }
}
export interface AIRequestSnapshotKey {
    template: {
        id: string
        title: string
    }
    fragment: {
        fullId: string
        hash: string
    }
}
export interface AIRequestSnapshot {
    response?: FragmentTransformResponse
    error?: any
}

export interface AIRequest {
    options: AIRequestOptions
    controller: AbortController
    request?: Promise<FragmentTransformResponse>
    response?: FragmentTransformResponse
    computing?: boolean
    error?: any
    progress?: ChatCompletionsProgressReport
    editsApplied?: boolean // null = waiting, false, true
}

export function snapshotAIRequestKey(r: AIRequest): AIRequestSnapshotKey {
    const { options, response, error } = r
    const key = {
        template: {
            id: options.template.id,
            title: options.template.title,
        },
        fragment: {
            fullId: options.fragment.fullId,
            hash: options.fragment.hash,
        },
    }
    return key
}

export function snapshotAIRequest(r: AIRequest): AIRequestSnapshot {
    const { options, response, error } = r
    const snapshot = structuredClone({
        response,
        error,
    })
    return snapshot
}

function getAIRequestCache() {
    return Cache.byName<AIRequestSnapshotKey, AIRequestSnapshot>("airequests")
}

export class ExtensionState extends EventTarget {
    readonly host: VSCodeHost
    private _project: CoArchProject = undefined
    private _aiRequest: AIRequest = undefined
    private _watcher: vscode.FileSystemWatcher | undefined
    private _diagColl: vscode.DiagnosticCollection
    private _aiRequestCache: Cache<AIRequestSnapshotKey, AIRequestSnapshot> =
        undefined

    readonly aiRequestContext: AIRequestContextOptions = {}

    constructor(public readonly context: ExtensionContext) {
        super()
        this.host = new VSCodeHost(this)
        this.host.addEventListener(CHANGE, this.dispatchChange.bind(this))
        const { subscriptions } = context
        subscriptions.push(this)

        this._diagColl = vscode.languages.createDiagnosticCollection("CoArch")
        subscriptions.push(this._diagColl)

        this._aiRequestCache = getAIRequestCache()

        // clear errors when file edited (remove me?)
        vscode.workspace.onDidChangeTextDocument(
            (ev) => {
                this._diagColl.set(ev.document.uri, [])
            },
            undefined,
            subscriptions
        )
    }

    aiRequestCache() {
        return this._aiRequestCache
    }

    async retryAIRequest(): Promise<void> {
        const options = this.aiRequest?.options
        await this.cancelAiRequest()
        await delay(100 + Math.random() * 1000)
        return options ? this.requestAI(options) : undefined
    }

    async requestAI(options: AIRequestOptions): Promise<void> {
        try {
            const req = await this.startAIRequest(options)
            const res = await req?.request
            const { edits, text } = res || {}
            if (text) openRequestOutput()

            if (edits) {
                req.editsApplied = null
                this.dispatchChange()
                const autoApplyEdits = !!options.template.autoApplyEdits
                req.editsApplied = await applyEdits(edits, {
                    needsConfirmation: !autoApplyEdits,
                })
                if (req.editsApplied) {
                    const key = snapshotAIRequestKey(req)
                    const snapshot = snapshotAIRequest(req)
                    await this._aiRequestCache.set(key, snapshot)
                    await Promise.all(
                        vscode.workspace.textDocuments
                            .filter((doc) => doc.isDirty)
                            .map((doc) => doc.save())
                    )
                    vscode.commands.executeCommand("coarch.request.status")
                }
                this.dispatchChange()

                const nextTemplate =
                    req.editsApplied &&
                    edits.length > 0 &&
                    this.project.templates.find(
                        (t) =>
                            t.id ===
                            options.template.nextTemplateAfterApplyEdits
                    )
                if (nextTemplate) {
                    // save all files
                    await Promise.all(
                        vscode.workspace.textDocuments.map((doc) => doc.save())
                    )
                    // save
                    await this.parseWorkspace()
                    // next prompt
                    vscode.commands.executeCommand(
                        "coarch.fragment.prompt",
                        options.fragment,
                        nextTemplate
                    )
                }
            }
        } catch (e) {
            if (isCancelError(e)) return
            else if (isTokenError(e)) {
                const fix = "Fix Token"
                const trace = "Open Trace"
                const res = await vscode.window.showErrorMessage(
                    "OpenAI token refused (403).",
                    fix,
                    trace
                )
                if (res === trace) openRequestTrace()
                else if (res === fix) await initToken(true)
            } else if (isRequestError(e)) {
                const trace = "Open Trace"
                const retry = "Retry"
                const msg = isRequestError(e, 404)
                    ? `OpenAI model not found (404). Does your token support the selected model?`
                    : e.message
                const res = await vscode.window.showWarningMessage(
                    msg,
                    retry,
                    trace
                )
                if (res === trace) openRequestTrace()
                else if (res === retry) await this.retryAIRequest()
            } else throw e
        }
    }

    private startAIRequest(options: AIRequestOptions): AIRequest {
        const controller = new AbortController()
        const config = vscode.workspace.getConfiguration("coarch")
        const maxCachedTemperature: number = config.get("maxCachedTemperature")
        const signal = controller.signal
        const r: AIRequest = {
            options,
            controller,
            request: null,
            computing: true,
            editsApplied: undefined,
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
        const { template, fragment } = options
        const runOptions: RunTemplateOptions = {
            requestOptions: { signal },
            partialCb,
            infoCb: (data) => {
                // TODO this should allow us to look at the trace while AI query is running
                // somehow it doesn't work though (VSCode shows empty preview and doesn't call into the markdown provider)
                r.response = data
                reqChange()
            },
            promptOptions: this.aiRequestContext,
            maxCachedTemperature,
            readClipboard: async () => {
                return await vscode.env.clipboard.readText()
            },
        }
        const templates = fragment
            .applicableTemplates()
            .filter((t) => !t.unlisted && !t.isSystem)
            .map(
                (t) =>
                    <PromptDefinition>{
                        id: t.id,
                        title: t.title,
                        description: t.description,
                    }
            )

        openRequestOutput()
        r.request = runTemplate(template, templates, fragment, runOptions)
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
        return r
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
        if (a && a.computing && !a?.controller?.signal?.aborted)
            a.controller?.abort("user cancelled")
    }

    get project() {
        return this._project
    }

    get rootFragments() {
        return this._project
            ? concatArrays(...this._project.rootFiles.map((p) => p.roots))
            : []
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
        const coarchJsonFiles = await findFiles("**/coarch.json")

        this.project = await parseProject({
            coarchFiles,
            promptFiles,
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
