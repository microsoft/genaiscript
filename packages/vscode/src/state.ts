import * as vscode from "vscode"

import { ExtensionContext } from "vscode"
import { VSCodeHost } from "./vshost"
import { applyEdits, toRange } from "./edit"
import { Utils } from "vscode-uri"
import { listFiles, saveAllTextDocuments } from "./fs"
import { parseAnnotations } from "../../core/src/annotations"
import { Project, PromptScriptRunOptions } from "../../core/src/server/messages"
import { ChatCompletionsProgressReport } from "../../core/src/chattypes"
import { fixCustomPrompts, fixPromptDefinitions } from "../../core/src/scripts"
import { logMeasure } from "../../core/src/perf"
import {
    TOOL_NAME,
    CHANGE,
    AI_REQUESTS_CACHE,
    TOOL_ID,
} from "../../core/src/constants"
import { isCancelError } from "../../core/src/error"
import { MarkdownTrace } from "../../core/src/trace"
import { logInfo, groupBy } from "../../core/src/util"
import { CORE_VERSION } from "../../core/src/version"
import { GenerationResult } from "../../core/src/server/messages"
import { hash, randomHex } from "../../core/src/crypto"
import { delay } from "es-toolkit"
import { Fragment } from "../../core/src/generation"
import { createWebview } from "./webview"
import { isEmptyString } from "../../core/src/cleaners"
import { createCache } from "../../core/src/cache"

export const FRAGMENTS_CHANGE = "fragmentsChange"
export const AI_REQUEST_CHANGE = "aiRequestChange"

export const REQUEST_OUTPUT_FILENAME = "GenAIScript Output.md"
export const REQUEST_TRACE_FILENAME = "GenAIScript Trace.md"

export interface AIRequestOptions {
    label: string
    scriptId: string
    template: PromptScript
    fragment: Fragment
    parameters: PromptParameters
    mode?: "notebook" | "chat"
    githubCopilotChatModelId?: string
    jsSource?: string
    runOptions?: Partial<PromptScriptRunOptions>
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
        hash: string
    }
    fragment: Fragment
    version: string
}
export interface AIRequestSnapshot {
    response?: Partial<GenerationResult>
    error?: any
    trace?: string
}

export interface AIRequest {
    creationTime: string
    options: AIRequestOptions
    controller: AbortController
    trace: MarkdownTrace
    runId?: string
    request?: Promise<Partial<GenerationResult>>
    response?: Partial<GenerationResult>
    computing?: boolean
    error?: any
    progress?: ChatCompletionsProgressReport
    editsApplied?: boolean // null = waiting, false, true
}

export function snapshotAIRequest(r: AIRequest): AIRequestSnapshot {
    const { response, error, creationTime, trace } = r
    const { env, ...responseWithoutVars } = response || {}
    const snapshot = structuredClone({
        creationTime,
        cacheTime: new Date().toISOString(),
        response: responseWithoutVars,
        error,
        trace: trace.content,
    })
    return snapshot
}

export class ExtensionState extends EventTarget {
    readonly host: VSCodeHost
    private _parseWorkspacePromise: Promise<void>
    private _project: Project = undefined
    private _aiRequest: AIRequest = undefined
    private _diagColl: vscode.DiagnosticCollection
    readonly output: vscode.LogOutputChannel
    readonly sessionApiKey: string
    private panel: vscode.WebviewPanel

    constructor(public readonly context: ExtensionContext) {
        super()
        this.sessionApiKey =
            vscode.env.uiKind === vscode.UIKind.Web ? undefined : randomHex(32)
        this.output = vscode.window.createOutputChannel(TOOL_NAME, {
            log: true,
        })
        if (this.sessionApiKey)
            this.output.info(`session api key: ${this.sessionApiKey}`)
        this.host = new VSCodeHost(this)
        this.host.addEventListener(CHANGE, this.dispatchChange.bind(this))
        const { subscriptions } = context
        subscriptions.push(this)

        this._diagColl = vscode.languages.createDiagnosticCollection(TOOL_NAME)
        subscriptions.push(this._diagColl)

        // clear errors when file edited (remove me?)
        subscriptions.push(
            vscode.workspace.onDidChangeTextDocument(
                (ev) => {
                    this._diagColl.set(ev.document.uri, [])
                },
                undefined,
                subscriptions
            )
        )
    }

    async showWebview(options?: { reveal?: boolean }) {
        const { reveal } = options || {}
        if (!this.panel) {
            this.panel = await createWebview(this)
            this.panel.onDidDispose(() => (this.panel = undefined))
        } else if (reveal) this.panel.reveal()
    }

    getConfiguration() {
        const config = vscode.workspace.getConfiguration(TOOL_ID)
        return config
    }

    async updateLanguageChatModels(model: string, chatModel: string) {
        const res = await this.languageChatModels()
        if (res[model] !== chatModel) {
            if (chatModel === undefined) delete res[model]
            else res[model] = chatModel
            const config = this.getConfiguration()
            await config.update("languageChatModels", res)
        }
    }

    async languageChatModels() {
        const config = this.getConfiguration()
        const res =
            (config.get("languageChatModels") as Record<string, string>) || {}
        return res
    }

    async applyEdits() {
        const req = this.aiRequest
        if (!req) return
        const edits = req.response?.edits?.filter(({ validated }) => !validated)
        if (!edits?.length) return

        req.editsApplied = null
        this.dispatchChange()

        const applied = await applyEdits(this, edits, {
            needsConfirmation: true,
        })
        req.editsApplied = applied
        if (req !== this.aiRequest) return
        if (req.editsApplied) saveAllTextDocuments()
        this.dispatchChange()
    }

    async requestAI(
        options: AIRequestOptions
    ): Promise<Partial<GenerationResult>> {
        try {
            const req = await this.startAIRequest(options)
            if (!req) {
                await this.cancelAiRequest()
                return undefined
            }
            const res = await req?.request
            const { edits, text, status } = res || {}

            if (!options.mode) {
                if (status === "error") this.showWebview({ reveal: true })
                else if (text) this.showWebview({ reveal: false })
            }

            this.setDiagnostics()
            this.dispatchChange()

            if (edits?.length && options.mode != "notebook") this.applyEdits()
            return res
        } catch (e) {
            if (isCancelError(e)) return undefined
            throw e
        }
    }

    dispatchAIRequestChange() {
        this.dispatchEvent(new Event(AI_REQUEST_CHANGE))
    }

    private async startAIRequest(
        options: AIRequestOptions
    ): Promise<AIRequest> {
        const controller = new AbortController()
        const config = this.getConfiguration()
        const cache = !!config.get("cache")
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
                this.dispatchAIRequestChange()
                this.setDiagnostics()
                this.dispatchChange()
            }
        }
        const partialCb = (progress: ChatCompletionsProgressReport) => {
            r.progress = progress
            if (!r.response) r.response = { text: "" }
            if (r.response) {
                r.response.text = progress.responseSoFar
                r.response.reasoning = progress.reasoningSoFar
                r.response.logprobs = progress.responseTokens
                if (/\n/.test(progress.responseChunk))
                    r.response.annotations = parseAnnotations(r.response.text)
            }
            reqChange()
        }
        this.aiRequest = r
        trace.addEventListener(CHANGE, reqChange)
        reqChange()

        const { scriptId, fragment, runOptions } = options
        const { files } = fragment || {}
        const infoCb = (partialResponse: { text: string }) => {
            r.response = partialResponse
            reqChange()
        }

        // todo: send js source
        const client = await this.host.server.client()
        const { runId, request } = await client.runScript(scriptId, files, {
            ...(runOptions || {}),
            jsSource: options.jsSource,
            signal,
            trace,
            infoCb,
            partialCb,
            cache,
            vars: structuredClone(options.parameters),
        })
        r.runId = runId
        r.request = request
        //        if (options.mode !== "chat")
        //            vscode.commands.executeCommand(
        //                "workbench.view.extension.genaiscript"
        //            )
        if (!options.mode) this.showWebview({ reveal: true })
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

    get parsing() {
        return !!this._parseWorkspacePromise
    }

    get aiRequest() {
        return this._aiRequest
    }

    get diagnostics() {
        const diagnostics = !!this.getConfiguration().get("diagnostics")
        return diagnostics
    }

    get debug() {
        const res = this.getConfiguration().get("debug") as string
        if (isEmptyString(res)) return undefined
        return res
    }

    private set aiRequest(r: AIRequest) {
        if (this._aiRequest !== r) {
            this._aiRequest = r
            this.dispatchAIRequestChange()
            this.dispatchChange()
        }
    }

    async cancelAiRequest() {
        const a = this.aiRequest
        if (a && a.computing) {
            a.computing = false
            if (a.controller && !a.controller?.signal?.aborted)
                a.controller.abort?.("user cancelled")
            const client = await this.host.server.client({ doNotStart: true })
            client?.cancel()
            this.dispatchChange()
            await delay(100)
        }
    }

    get project() {
        if (!this._project) this.parseWorkspace()
        return this._project
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

    async activate() {
        await this.host.activate()
        logInfo("genaiscript extension activated")
    }

    async fixPromptDefinitions() {
        const project = this.project
        if (!project) return

        const cwd = this.host.projectFolder().toLowerCase()
        const hasProjects = project.scripts?.some(
            (s) =>
                !s.unlisted &&
                s.filename &&
                s.filename.toLowerCase().startsWith(cwd)
        )
        if (!hasProjects) return

        const config = this.getConfiguration()
        const localTypeDefinitions = !!config.get("localTypeDefinitions")
        if (localTypeDefinitions) await fixPromptDefinitions(project)

        const githubCopilotPrompt = !!config.get("githubCopilotPrompt")
        if (githubCopilotPrompt) fixCustomPrompts({ githubCopilotPrompt: true }) // finish async
    }

    async parseWorkspace() {
        if (this._parseWorkspacePromise) return this._parseWorkspacePromise

        const parser = async () => {
            try {
                this.dispatchChange()
                performance.mark(`save-docs`)
                await saveAllTextDocuments()
                performance.mark(`project-start`)
                performance.mark(`scan-tools`)
                const client = await this.host.server.client()
                const newProject = await client.listScripts()
                await this.setProject(newProject)
                this.setDiagnostics()
                logMeasure(`project`, `project-start`, `project-end`)
            } finally {
                this._parseWorkspacePromise = undefined
                this.dispatchChange()
            }
        }

        this._parseWorkspacePromise = parser()
        this.dispatchChange()
        await this._parseWorkspacePromise
    }

    async parseDirectory(
        uri: vscode.Uri,
        token?: vscode.CancellationToken
    ): Promise<Fragment> {
        const files = await listFiles(uri)

        return <Fragment>{
            files: files.map((fs) => fs.fsPath),
        }
    }

    async parseDocument(
        document: vscode.Uri,
        token?: vscode.CancellationToken
    ): Promise<Fragment> {
        const fsPath = document.fsPath
        return <Fragment>{
            files: [fsPath],
        }
    }

    private setDiagnostics() {
        this._diagColl.clear()
        if (this._aiRequest?.options?.mode === "notebook") return

        let diagnostics = this.project.diagnostics
        if (this._aiRequest?.response?.annotations?.length)
            diagnostics = diagnostics.concat(
                this._aiRequest?.response?.annotations
            )
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
                    target = vscode.Uri.parse(murl[2], true)
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
            const uri = Utils.resolvePath(this.host.projectUri, filename)
            this._diagColl.set(uri, ds)
        }
    }

    private clear() {
        this.dispatchChange()
    }

    dispose() {
        this.clear()
    }
}
