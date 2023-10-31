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
import { findFiles, readFileText, saveAllTextDocuments, writeFile } from "./fs"

const MAX_HISTORY_LENGTH = 500

export const TOKEN_DOCUMENTATION_URL =
    "https://github.com/microsoft/gptools/tree/main/packages/vscode#openai-or-llama-token"

export const FRAGMENTS_CHANGE = "fragmentsChange"
export const AI_REQUEST_CHANGE = "aiRequestChange"

export const REQUEST_OUTPUT_FILENAME = "GPTools Output.md"
export const REQUEST_TRACE_FILENAME = "GPTools Trace.md"

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

        this._diagColl = vscode.languages.createDiagnosticCollection("GPTools")
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
            await initToken()
            const req = await this.startAIRequest(options)
            const res = await req?.request
            const { edits, text } = res || {}
            if (text) openRequestOutput()

            if (edits) {
                req.editsApplied = null
                this.dispatchChange()
                const autoApplyEdits = !!options.template.autoApplyEdits
                vscode.commands.executeCommand("coarch.request.status")
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
                }
                this.dispatchChange()
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
            } else if (isRequestError(e, 400)) {
                const help = "Documentation"
                const msg = `Invalid OpenAI token or configuration string.`
                const res = await vscode.window.showWarningMessage(msg, help)
                if (res === help)
                    vscode.env.openExternal(
                        vscode.Uri.parse(TOKEN_DOCUMENTATION_URL)
                    )
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

    readonly requestHistory: {
        filename: string
        template: string
    }[] = []

    private startAIRequest(options: AIRequestOptions): AIRequest {
        const controller = new AbortController()
        const config = vscode.workspace.getConfiguration("gptools")
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
        this.requestHistory.push({
            template: template.id,
            filename: fragment.file.filename,
        })
        if (this.requestHistory.length > MAX_HISTORY_LENGTH)
            this.requestHistory.shift()

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
        if (a && a.computing && !a?.controller?.signal?.aborted) {
            a.controller?.abort("user cancelled")
            this.dispatchChange()
        }
    }

    get project() {
        return this._project
    }

    get rootFragments() {
        return this._project
            ? concatArrays(...this._project.rootFiles.map((p) => p.roots))
            : []
    }

    private async setProject(prj: CoArchProject) {
        this._project = prj
        await this.fixPromptDefinitions()
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
            console.log(`gptools: watch changed`)
            await this.fixPromptDefinitions()
            await this.parseWorkspace()
        }, 1000)

        this._watcher = vscode.workspace.createFileSystemWatcher(
            "**/*.{gpspec.md,gptool.js}"
        )
        this._watcher.onDidChange(handleChange)
        this._watcher.onDidCreate(handleChange)
        this._watcher.onDidDelete(handleChange)
    }

    async activate() {
        console.log(`gptools: activate`)
        this.initWatcher()
        await this.fixPromptDefinitions()
        await this.parseWorkspace()
    }

    async fixPromptDefinitions() {
        const prompts = await vscode.workspace.findFiles("**/*.gptool.js")
        const folders = new Set(prompts.map((f) => Utils.dirname(f).fsPath))
        for (const folder of folders) {
            const f = vscode.Uri.file(folder)
            for (let [defName, defContent] of Object.entries(
                promptDefinitions
            )) {
                if (this.project && defName === "gptools.d.ts") {
                    const systems = this.project.templates
                        .filter((t) => t.isSystem)
                        .map((s) => `"${s.id}"`)
                    defContent = defContent.replace(
                        "type SystemPromptId = string",
                        `type SystemPromptId = ${systems.join(" | ")}`
                    )
                }
                const current = await readFileText(f, defName)
                if (current !== defContent)
                    await writeFile(f, defName, defContent)
            }
        }
    }

    async parseWorkspace() {
        this.dispatchChange()

        const coarchFiles = await findFiles("**/*.gpspec.md")
        const promptFiles = await findFiles("**/*.gptool.js")
        const coarchJsonFiles = await findFiles("**/gptools.json")

        const newProject = await parseProject({
            coarchFiles,
            promptFiles,
            coarchJsonFiles,
        })
        await this.setProject(newProject)
        this.setDiagnostics()
    }

    async parseDocument(
        document: vscode.TextDocument,
        token?: vscode.CancellationToken
    ) {
        const fspath = document.uri.fsPath
        const fn = Utils.basename(document.uri)
        const specn = fspath + ".gpspec.md"
        this.host.setVirtualFile(
            specn,
            `# ${fn}

-   [${fn}](./${fn})
`
        )
        const coarchFiles = [specn]
        const promptFiles = await findFiles("**/*.gptool.js")
        if (token?.isCancellationRequested) return undefined
        const coarchJsonFiles = await findFiles("**/gptools.json")
        if (token?.isCancellationRequested) return undefined

        const newProject = await parseProject({
            coarchFiles,
            promptFiles,
            coarchJsonFiles,
        })
        return newProject
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
                    r.source = "GPTools"
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
