import * as vscode from "vscode"
import {
    ChatCompletionsProgressReport,
    Project,
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
    logInfo,
    logMeasure,
    parseAnnotations,
    MarkdownTrace,
    coreVersion,
    sha256string,
    dotGenaiscriptPath,
    CLI_JS,
} from "genaiscript-core"
import { ExtensionContext } from "vscode"
import { debounceAsync } from "./debounce"
import { VSCodeHost } from "./vshost"
import { applyEdits, toRange } from "./edit"
import { Utils } from "vscode-uri"
import { findFiles, readFileText, saveAllTextDocuments, writeFile } from "./fs"
import { configureChatCompletionForChatAgent } from "./chat-agent/agent"
import { infoUri } from "./markdowndocumentprovider"
import { createVSPath } from "./vspath"
import { TOOL_NAME } from "./extension"

const MAX_HISTORY_LENGTH = 500

export const TOKEN_DOCUMENTATION_URL =
    "https://github.com/microsoft/genaiscript/blob/main/docs/token.md"
export const CONTEXT_LENGTH_DOCUMENTATION_URL =
    "https://github.com/microsoft/genaiscript/blob/main/docs/token.md"

export const FRAGMENTS_CHANGE = "fragmentsChange"
export const AI_REQUEST_CHANGE = "aiRequestChange"

export const REQUEST_OUTPUT_FILENAME = "GenAIScript Output.md"
export const REQUEST_TRACE_FILENAME = "GenAIScript Trace.md"

export interface ChatRequestContext {
    context: ChatAgentContext
    access: vscode.ChatAccess
    progress: vscode.Progress<vscode.ChatAgentProgress>
    token: vscode.CancellationToken
}

export interface AIRequestOptions {
    label: string
    template: PromptTemplate
    fragment: Fragment
    chat?: ChatRequestContext
}

export interface AIRequestContextOptions {}

export class FragmentsEvent extends Event {
    constructor(readonly fragments?: Fragment[]) {
        super(FRAGMENTS_CHANGE)
    }
}
export interface AIRequestSnapshotKey {
    template: {
        id: string
        title: string
        hash: string
    }
    fragment: {
        fullId: string
        hash: string
    }
    version: string
}
export interface AIRequestSnapshot {
    response?: Partial<FragmentTransformResponse>
    error?: any
    trace?: string
}

export interface AIRequest {
    creationTime: string
    options: AIRequestOptions
    controller: AbortController
    trace: MarkdownTrace
    request?: Promise<FragmentTransformResponse>
    response?: Partial<FragmentTransformResponse>
    computing?: boolean
    error?: any
    progress?: ChatCompletionsProgressReport
    editsApplied?: boolean // null = waiting, false, true
}

export async function snapshotAIRequestKey(
    r: AIRequest
): Promise<AIRequestSnapshotKey> {
    const { options, request } = r
    const key = {
        template: {
            id: options.template.id,
            title: options.template.title,
            hash: await sha256string(JSON.stringify(options.template)),
        },
        fragment: {
            fullId: options.fragment.fullId,
            hash: options.fragment.hash,
        },
        version: coreVersion,
    }
    return key
}

export function snapshotAIRequest(r: AIRequest): AIRequestSnapshot {
    const { response, error, creationTime } = r
    const { vars, ...responseWithoutVars } = response || {}
    const snapshot = structuredClone({
        creationTime,
        cacheTime: new Date().toISOString(),
        response: responseWithoutVars,
        error,
        trace: r.trace.content,
    })
    return snapshot
}

function getAIRequestCache() {
    return Cache.byName<AIRequestSnapshotKey, AIRequestSnapshot>("airequests")
}

export class ExtensionState extends EventTarget {
    readonly host: VSCodeHost
    private _project: Project = undefined
    private _aiRequest: AIRequest = undefined
    private _watcher: vscode.FileSystemWatcher | undefined
    private _diagColl: vscode.DiagnosticCollection
    private _aiRequestCache: Cache<AIRequestSnapshotKey, AIRequestSnapshot> =
        undefined
    readonly output: vscode.LogOutputChannel

    readonly aiRequestContext: AIRequestContextOptions = {}

    constructor(public readonly context: ExtensionContext) {
        super()
        this.output = vscode.window.createOutputChannel(TOOL_NAME, {
            log: true,
        })
        this.host = new VSCodeHost(this)
        this.host.addEventListener(CHANGE, this.dispatchChange.bind(this))
        const { subscriptions } = context
        subscriptions.push(this)

        this._diagColl =
            vscode.languages.createDiagnosticCollection(TOOL_NAME)
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

    private async saveGptoolsJs() {
        const p = Utils.joinPath(this.context.extensionUri, CLI_JS)
        const cli = vscode.Uri.file(dotGenaiscriptPath(CLI_JS))
        await vscode.workspace.fs.createDirectory(
            vscode.Uri.file(dotGenaiscriptPath("."))
        )
        await vscode.workspace.fs.copy(p, cli, { overwrite: true })
    }

    aiRequestCache() {
        return this._aiRequestCache
    }

    async retryAIRequest(): Promise<void> {
        const options = this.aiRequest?.options
        await this.cancelAiRequest()
        if (options) {
            await delay(100 + Math.random() * 1000)
            await this.requestAI(options)
        }
    }

    async applyEdits() {
        const req = this.aiRequest
        if (!req) return
        const edits = req.response?.edits
        if (!edits) return

        req.editsApplied = null
        this.dispatchChange()

        const applied = await applyEdits(edits, {
            needsConfirmation: true,
        })

        req.editsApplied = applied
        if (req !== this.aiRequest) return
        if (req.editsApplied) saveAllTextDocuments()
        this.dispatchChange()
    }

    async requestAI(options: AIRequestOptions): Promise<void> {
        try {
            if (!options.chat) await initToken()
            const req = await this.startAIRequest(options)
            const res = await req?.request
            const { edits, text } = res || {}
            if (text && !options.chat)
                vscode.commands.executeCommand("genaiscript.request.open.output")

            const key = await snapshotAIRequestKey(req)
            const snapshot = snapshotAIRequest(req)
            await this._aiRequestCache.set(key, snapshot)
            this.setDiagnostics()
            this.dispatchChange()

            if (edits?.length) {
                if (!options.chat) this.applyEdits()
                else {
                    options.chat.progress.report(<vscode.ChatAgentFileTree>{
                        treeData: {
                            label: "edits",
                            uri: vscode.Uri.parse(REQUEST_OUTPUT_FILENAME),
                            children: edits.map(
                                (e) =>
                                    <vscode.ChatAgentFileTreeData>{
                                        label: e.label,
                                        uri: infoUri(REQUEST_OUTPUT_FILENAME),
                                    }
                            ),
                        },
                    })
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
                if (res === trace)
                    vscode.commands.executeCommand("genaiscript.request.open.trace")
                else if (res === fix) await initToken(true)
            } else if (isRequestError(e, 400, "context_length_exceeded")) {
                const help = "Documentation"
                const title = `Context length exceeded.`
                const msg = `${title}.
    ${e.message}`
                const res = await vscode.window.showWarningMessage(msg, help)
                if (res === help)
                    vscode.env.openExternal(
                        vscode.Uri.parse(CONTEXT_LENGTH_DOCUMENTATION_URL)
                    )
            } else if (isRequestError(e, 400)) {
                const help = "Documentation"
                const msg = `OpenAI model error (400).
${e.message}`
                const res = await vscode.window.showWarningMessage(msg, help)
                if (res === help)
                    vscode.env.openExternal(
                        vscode.Uri.parse(TOKEN_DOCUMENTATION_URL)
                    )
            } else if (isRequestError(e)) {
                const msg = isRequestError(e, 404)
                    ? `OpenAI model not found (404). Does your token support the selected model?`
                    : e.message
                await vscode.window.showWarningMessage(msg)
            } else throw e
        }
    }

    readonly requestHistory: {
        filename: string
        template: string
    }[] = []

    private async startAIRequest(
        options: AIRequestOptions
    ): Promise<AIRequest> {
        const controller = new AbortController()
        const config = vscode.workspace.getConfiguration("genaiscript")
        const maxCachedTemperature: number = config.get("maxCachedTemperature")
        const maxCachedTopP: number = config.get("maxCachedTopP")
        const signal = controller.signal
        const trace = new MarkdownTrace()

        const r: AIRequest = {
            creationTime: new Date().toISOString(),
            options,
            controller,
            request: null,
            computing: true,
            editsApplied: undefined,
            trace,
        }
        const reqChange = () => {
            if (this._aiRequest === r) {
                this.dispatchEvent(new Event(AI_REQUEST_CHANGE))
                this.setDiagnostics()
                this.dispatchChange()
            }
        }
        trace.addEventListener(MarkdownTrace.CHANGE, reqChange)
        const partialCb = (progress: ChatCompletionsProgressReport) => {
            r.progress = progress
            if (r.response) {
                r.response.text = progress.responseSoFar
                if (/\n/.test(progress.responseChunk))
                    r.response.annotations = parseAnnotations(r.response.text)
            }
            if (r.options.chat?.progress)
                r.options.chat?.progress?.report({
                    content: progress.responseChunk,
                })
            reqChange()
        }
        this.aiRequest = r
        const { template, fragment } = options
        let varsProgressReported = false
        const runOptions: RunTemplateOptions = {
            requestOptions: { signal },
            partialCb,
            trace,
            infoCb: (data) => {
                r.response = data
                const progress = r.options.chat?.progress
                if (progress) {
                    if (data.text)
                        progress.report(<vscode.ChatAgentProgressMessage>{
                            message: data.text,
                        })
                    if (data.summary)
                        progress.report({
                            content: data.summary,
                        })
                    if (data.vars && !varsProgressReported) {
                        varsProgressReported = true
                        data.vars.files
                            ?.map(({ filename }) => {
                                return /^https?:/i.test(filename)
                                    ? vscode.Uri.parse(filename)
                                    : vscode.Uri.joinPath(
                                          this.host.projectUri,
                                          filename
                                      )
                            })
                            ?.forEach((reference) =>
                                progress.report(<
                                    vscode.ChatAgentContentReference
                                >{ reference })
                            )
                    }
                }
                reqChange()
            },
            promptOptions: this.aiRequestContext,
            maxCachedTemperature,
            maxCachedTopP,
            cache: true,
            retry: 3,
            cliInfo: {
                spec: vscode.workspace.asRelativePath(
                    this.host.isVirtualFile(fragment.file.filename)
                        ? fragment.file.filename.replace(/\.gpspec\.md$/i, "")
                        : fragment.file.filename
                ),
            },
            chat: options.chat?.context,
            path: createVSPath(),
        }

        if (options.chat) {
            const hasToken = await this.host.getSecretToken()
            if (!hasToken && template.copilot)
                configureChatCompletionForChatAgent(options, runOptions)
        }

        this.requestHistory.push({
            template: template.id,
            filename: fragment.file.filename,
        })
        if (this.requestHistory.length > MAX_HISTORY_LENGTH)
            this.requestHistory.shift()

        r.request = runTemplate(template, fragment, runOptions)

        if (!options.chat)
            vscode.commands.executeCommand("genaiscript.request.open.output")

        r.request
            .then((resp) => {
                r.response = resp
                r.computing = false
                if (resp.error) r.error = resp.error
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

    async cancelAiRequest() {
        const a = this.aiRequest
        if (a && a.computing && !a?.controller?.signal?.aborted) {
            a.controller?.abort("user cancelled")
            this.dispatchChange()
            await delay(100)
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

    private async setProject(prj: Project) {
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
        this.initWatcher()
        await this.saveGptoolsJs()
        await this.fixPromptDefinitions()
        await this.parseWorkspace()

        logInfo("genaiscript extension acticated")
    }

    async fixPromptDefinitions() {
        const prompts = await vscode.workspace.findFiles("**/*.genai.js")
        const folders = new Set(prompts.map((f) => Utils.dirname(f).fsPath))
        for (const folder of folders) {
            const f = vscode.Uri.file(folder)
            for (let [defName, defContent] of Object.entries(
                promptDefinitions
            )) {
                if (this.project && defName === "genaiscript.d.ts") {
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

        performance.mark(`project-start`)
        const gpspecFiles = await findFiles("**/*.gpspec.md")
        performance.mark(`scan-tools`)
        const gptoolFiles = await findFiles("**/*.genai.js")
        performance.mark(`parse-project`)
        const newProject = await parseProject({
            gpspecFiles,
            gptoolFiles,
        })
        await this.setProject(newProject)
        this.setDiagnostics()
        logMeasure(`project`, `project-start`, `project-end`)
    }

    async parseDirectory(uri: vscode.Uri, token?: vscode.CancellationToken) {
        const fspath = uri.fsPath
        const specn = fspath + "/dir.gpspec.md"
        const files = await (
            await vscode.workspace.fs.readDirectory(uri)
        )
            .filter(([, type]) => type === vscode.FileType.File)
            .map(([name]) => name)
            .filter((name) => !name.endsWith(".gpspec.md"))
        if (token?.isCancellationRequested) return undefined

        this.host.clearVirtualFiles()
        this.host.setVirtualFile(
            specn,
            `# Specification

${files.map((fn) => `-   [${fn}](./${fn})`).join("\n")}
`
        )

        const gpspecFiles = [specn]
        const gptoolFiles = await findFiles("**/*.genai.js")
        if (token?.isCancellationRequested) return undefined

        const newProject = await parseProject({
            gpspecFiles,
            gptoolFiles,
        })
        return newProject
    }

    async parseDocument(
        document: vscode.TextDocument,
        token?: vscode.CancellationToken
    ) {
        const fspath = document.uri.fsPath
        const fn = Utils.basename(document.uri)
        const specn = fspath + ".gpspec.md"
        this.host.clearVirtualFiles()
        this.host.setVirtualFile(
            specn,
            `# Specification

-   [${fn}](./${fn})
`
        )
        const gpspecFiles = [specn]
        const gptoolFiles = await findFiles("**/*.genai.js")
        if (token?.isCancellationRequested) return undefined

        const newProject = await parseProject({
            gpspecFiles,
            gptoolFiles,
        })
        return newProject
    }

    private setDiagnostics() {
        let diagnostics = this.project.diagnostics
        if (this._aiRequest?.response?.annotations?.length)
            diagnostics = diagnostics.concat(
                this._aiRequest?.response?.annotations
            )
        this._diagColl.clear()
        // project entries
        const severities: Record<
            DiagnosticSeverity | "notice",
            vscode.DiagnosticSeverity
        > = {
            notice: vscode.DiagnosticSeverity.Information,
            warning: vscode.DiagnosticSeverity.Warning,
            error: vscode.DiagnosticSeverity.Error,
            info: vscode.DiagnosticSeverity.Information,
        }
        for (const [filename, diags] of Object.entries(
            groupBy(diagnostics, (d) => d.filename)
        )) {
            const ds = diags.map((d) => {
                let message = d.message
                let value: string
                let target: vscode.Uri
                const murl = /\[([^\]]+)\]\((https:\/\/([^)]+))\)/.exec(message)
                if (murl) {
                    value = murl[1]
                    target = vscode.Uri.parse(murl[2])
                }
                const r = new vscode.Diagnostic(
                    toRange(d.range),
                    message || "...",
                    severities[d.severity]
                )
                r.source = TOOL_NAME
                r.code = target
                    ? {
                          value,
                          target,
                      }
                    : undefined
                return r
            })
            const uri = vscode.Uri.file(filename)
            this._diagColl.set(uri, ds)
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
