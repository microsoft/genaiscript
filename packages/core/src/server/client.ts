import { ChatCompletionsProgressReport } from "../chattypes"
import { CLIENT_RECONNECT_DELAY, OPEN, RECONNECT } from "../constants"
import { randomHex } from "../crypto"
import { errorMessage } from "../error"
import { GenerationResult } from "../generation"
import { ResponseStatus, host } from "../host"
import { MarkdownTrace } from "../trace"
import { assert, logError } from "../util"
import {
    RequestMessage,
    RequestMessages,
    ServerVersion,
    PromptScriptTestRun,
    PromptScriptTestRunOptions,
    PromptScriptTestRunResponse,
    ShellExecResponse,
    ShellExec,
    PromptScriptRunOptions,
    PromptScriptStart,
    PromptScriptAbort,
    PromptScriptResponseEvents,
    ServerEnv,
    ChatEvents,
    ChatChunk,
    ChatStart,
    ServerEnvResponse,
    ClientRequeMessages,
    ClientRequestMessages,
} from "./messages"

export type LanguageModelChatRequest = (
    request: ChatStart,
    onChunk: (param: Omit<ChatChunk, "id" | "type" | "chatId">) => void
) => Promise<void>

export class WebSocketClient extends EventTarget {
    private awaiters: Record<
        string,
        { resolve: (data: any) => void; reject: (error: unknown) => void }
    > = {}
    private _nextId = 1
    private _ws: WebSocket
    private _pendingMessages: string[] = []
    private _reconnectTimeout: ReturnType<typeof setTimeout> | undefined
    connectedOnce = false
    reconnectAttempts = 0

    chatRequest: LanguageModelChatRequest

    private runs: Record<
        string,
        {
            script: string
            files: string[]
            options: Partial<PromptScriptRunOptions>
            trace: MarkdownTrace
            infoCb: (partialResponse: { text: string }) => void
            partialCb: (progress: ChatCompletionsProgressReport) => void
            promise: Promise<GenerationResult>
            resolve: (value: GenerationResult) => void
            reject: (reason?: any) => void
            signal: AbortSignal
        }
    > = {}

    constructor(readonly url: string) {
        super()
    }

    private installPolyfill() {
        if (typeof WebSocket === "undefined") {
            try {
                require("websocket-polyfill")
            } catch (err) {
                logError("websocket polyfill failed")
                logError(err)
            }
        }
    }

    async init(): Promise<void> {
        if (this._ws) return Promise.resolve(undefined)
        this.connect()
        await host.server.start()
    }

    private reconnect() {
        this.reconnectAttempts++
        this.dispatchEvent(new Event(RECONNECT))
        this._ws = undefined
        clearTimeout(this._reconnectTimeout)
        this._reconnectTimeout = setTimeout(() => {
            this.connect()
        }, CLIENT_RECONNECT_DELAY)
    }

    private connect(): void {
        assert(!this._ws, "already connected")
        this.installPolyfill()

        this._ws = new WebSocket(this.url)
        this._ws.addEventListener("open", () => {
            // clear counter
            this.connectedOnce = true
            this.reconnectAttempts = 0
            // flush cached messages
            let m: string
            while (
                this._ws?.readyState === WebSocket.OPEN &&
                (m = this._pendingMessages.pop())
            )
                this._ws.send(m)
            this.dispatchEvent(new Event(OPEN))
        })
        this._ws.addEventListener("error", (ev) => {
            this.reconnect()
        })
        this._ws.addEventListener("close", (ev: CloseEvent) => {
            this.cancel(ev.reason)
            for (const [runId, run] of Object.entries(this.runs)) {
                run.reject(ev.reason || "websocket closed")
                delete this.runs[runId]
            }
            this.reconnect()
        })
        this._ws.addEventListener("message", <
            (event: MessageEvent<any>) => void
        >(async (event) => {
            const data = JSON.parse(event.data)
            // handle responses
            const req: RequestMessages = data
            const { id } = req
            const awaiter = this.awaiters[id]
            if (awaiter) {
                delete this.awaiters[id]
                await awaiter.resolve(req)
                return
            }

            // handle run progress
            const ev: PromptScriptResponseEvents = data
            const { runId, type } = ev
            const run = this.runs[runId]
            if (run) {
                switch (type) {
                    case "script.progress": {
                        if (ev.trace) run.trace.appendContent(ev.trace)
                        if (ev.progress) run.infoCb({ text: ev.progress })
                        if (ev.response || ev.tokens !== undefined)
                            run.partialCb({
                                responseChunk: ev.responseChunk,
                                responseSoFar: ev.response,
                                tokensSoFar: ev.tokens,
                            })
                        break
                    }
                    case "script.end": {
                        const run = this.runs[runId]
                        delete this.runs[runId]
                        if (run) {
                            const res = structuredClone(ev.result)
                            if (res) run.infoCb(res)
                            run.resolve(res)
                        }
                        break
                    }
                }
            } else {
                const cev: ClientRequestMessages = data
                const { type } = cev
                switch (type) {
                    case "authentication.session": {
                        const resp = await this.authenticationSession(cev.model)
                        this.queue({
                            ...resp,
                            type: "authentication.session",
                        })
                        break
                    }
                    case "chat.start": {
                        const { chatId } = cev
                        if (!this.chatRequest)
                            throw new Error(
                                "client language model not supported"
                            )
                        await this.chatRequest(cev, (chunk) => {
                            this.queue<ChatChunk>({
                                ...chunk,
                                chatId,
                                type: "chat.chunk",
                            })
                        })
                        // done
                    }
                }
            }
        }))
    }

    private queue<T extends RequestMessage>(msg: Omit<T, "id">): Promise<T> {
        const id = this._nextId++ + ""
        const mo: any = { ...msg, id }
        // avoid pollution
        delete mo.trace
        if (mo.options) delete mo.options.trace
        const m = JSON.stringify({ ...msg, id })

        this.init()
        return new Promise<T>((resolve, reject) => {
            this.awaiters[id] = {
                resolve: (data) => resolve(data),
                reject,
            }
            if (this._ws?.readyState === WebSocket.OPEN) {
                this._ws.send(m)
            } else this._pendingMessages.push(m)
        })
    }

    stop() {
        this.reconnectAttempts = 0
        if (this._reconnectTimeout) {
            clearTimeout(this._reconnectTimeout)
            this._reconnectTimeout = undefined
        }
        if (this._ws) {
            const ws = this._ws
            this._ws = undefined
            if (ws.readyState !== WebSocket.CLOSED)
                try {
                    ws.close()
                } finally {
                }
        }
        this.cancel()
    }

    cancel(reason?: string) {
        this.reconnectAttempts = 0
        this._pendingMessages = []
        const cancellers = Object.values(this.awaiters)
        this.awaiters = {}
        cancellers.forEach((a) => a.reject(reason || "cancelled"))
    }

    async version(): Promise<string> {
        const res = await this.queue<ServerVersion>({ type: "server.version" })
        return res.version
    }

    async infoEnv(): Promise<ServerEnvResponse> {
        const res = await this.queue<ServerEnv>({ type: "server.env" })
        return res.response as ServerEnvResponse
    }

    async startScript(
        script: string,
        files: string[],
        options: Partial<PromptScriptRunOptions> & {
            signal: AbortSignal
            trace: MarkdownTrace
            infoCb: (partialResponse: { text: string }) => void
            partialCb: (progress: ChatCompletionsProgressReport) => void
        }
    ) {
        const runId = randomHex(6)
        const { signal, infoCb, partialCb, trace, ...optionsRest } = options
        let resolve: (value: GenerationResult) => void
        let reject: (reason?: any) => void
        const promise = new Promise<GenerationResult>((res, rej) => {
            resolve = res
            reject = rej
        })
        this.runs[runId] = {
            script,
            files,
            options,
            trace,
            infoCb,
            partialCb,
            promise,
            resolve,
            reject,
            signal,
        }
        signal?.addEventListener("abort", () => {
            this.abortScript(runId)
        })
        const res = await this.queue<PromptScriptStart>({
            type: "script.start",
            runId,
            script,
            files,
            options: optionsRest,
        })
        if (!res.response?.ok) {
            delete this.runs[runId] // failed to start
            throw new Error(
                errorMessage(res.response?.error) ?? "failed to start script"
            )
        }
        return { runId, request: promise }
    }

    async abortScript(runId: string, reason?: string): Promise<ResponseStatus> {
        delete this.runs[runId]
        const res = await this.queue<PromptScriptAbort>({
            type: "script.abort",
            runId,
            reason,
        })
        return res.response
    }

    abortScriptRuns(reason?: string) {
        for (const runId of Object.keys(this.runs)) {
            this.abortScript(runId, reason)
            delete this.runs[runId]
        }
    }

    async runTest(
        script: PromptScript,
        options?: PromptScriptTestRunOptions
    ): Promise<PromptScriptTestRunResponse> {
        const res = await this.queue<PromptScriptTestRun>({
            type: "tests.run",
            scripts: script?.id ? [script?.id] : undefined,
            options,
        })
        return res.response
    }

    async exec(
        containerId: string,
        command: string,
        args: string[],
        options: ShellOptions
    ): Promise<ShellExecResponse> {
        const res = await this.queue<ShellExec>({
            type: "shell.exec",
            containerId,
            command,
            args,
            options,
        })
        return res.response
    }

    kill(): void {
        if (
            typeof WebSocket !== "undefined" &&
            this._ws?.readyState === WebSocket.OPEN
        )
            this._ws.send(
                JSON.stringify({ type: "server.kill", id: this._nextId++ + "" })
            )
        this.stop()
    }

    dispose(): any {
        this.kill()
        return undefined
    }
}
