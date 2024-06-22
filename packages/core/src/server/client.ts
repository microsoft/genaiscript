import { CLIENT_RECONNECT_DELAY } from "../constants"
import {
    ModelService,
    ParsePdfResponse,
    ParseService,
    ResponseStatus,
    RetrievalSearchOptions,
    RetrievalSearchResponse,
    RetrievalService,
    RetrievalUpsertOptions,
    host,
} from "../host"
import { TraceOptions } from "../trace"
import { assert, logError } from "../util"
import {
    ParsePdfMessage,
    RequestMessage,
    RequestMessages,
    RetrievalVectorClear,
    RetrievalSearch,
    RetrievalVectorUpsert,
    ServerVersion,
    PromptScriptTestRun,
    PromptScriptTestRunOptions,
    ModelsPull,
    PromptScriptTestRunResponse,
    ShellExecResponse,
    ShellExec,
    ContainerStartResponse,
    ContainerStart,
    ContainerRemove,
    PromptScriptRunOptions,
    PromptScriptStart,
    PromptScriptAbort,
} from "./messages"

export class WebSocketClient
    implements RetrievalService, ParseService, ModelService
{
    private awaiters: Record<
        string,
        { resolve: (data: any) => void; reject: (error: unknown) => void }
    > = {}
    private _nextId = 1
    private _ws: WebSocket
    private _pendingMessages: string[] = []
    private _reconnectTimeout: ReturnType<typeof setTimeout> | undefined

    constructor(readonly url: string) {}

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
            // flush cached messages
            let m: string
            while (
                this._ws?.readyState === WebSocket.OPEN &&
                (m = this._pendingMessages.pop())
            )
                this._ws.send(m)
        })
        this._ws.addEventListener("error", (ev) => {
            this.reconnect()
        })
        this._ws.addEventListener("close", (ev: CloseEvent) => {
            this.cancel(ev.reason)
            this.reconnect()
        })
        this._ws.addEventListener("message", <
            (event: MessageEvent<any>) => void
        >(async (event) => {
            const data: RequestMessages = JSON.parse(event.data)
            const { id } = data
            const awaiter = this.awaiters[id]
            if (awaiter) {
                delete this.awaiters[id]
                await awaiter.resolve(data)
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
        if (this._reconnectTimeout) {
            clearTimeout(this._reconnectTimeout)
            this._reconnectTimeout = undefined
        }
        if (this._ws) {
            this._ws.close()
            this._ws = undefined
        }
        this.cancel()
    }

    cancel(reason?: string) {
        this._pendingMessages = []
        const cancellers = Object.values(this.awaiters)
        this.awaiters = {}
        cancellers.forEach((a) => a.reject(reason || "cancelled"))
    }

    async version(): Promise<string> {
        const res = await this.queue<ServerVersion>({ type: "server.version" })
        return res.version
    }

    async pullModel(model: string): Promise<ResponseStatus> {
        const res = await this.queue<ModelsPull>({
            type: "models.pull",
            model,
        })
        return res.response
    }

    async vectorClear(options: VectorSearchOptions): Promise<ResponseStatus> {
        const res = await this.queue<RetrievalVectorClear>({
            type: "retrieval.vectorClear",
            options,
        })
        return res.response
    }

    async vectorSearch(
        text: string,
        options?: RetrievalSearchOptions
    ): Promise<RetrievalSearchResponse> {
        const res = await this.queue<RetrievalSearch>({
            type: "retrieval.vectorSearch",
            text,
            options,
        })
        return res.response
    }
    async vectorUpsert(filename: string, options?: RetrievalUpsertOptions) {
        const res = await this.queue<RetrievalVectorUpsert>({
            type: "retrieval.vectorUpsert",
            filename,
            options,
        })
        return res.response
    }

    async parsePdf(
        filename: string,
        options?: TraceOptions
    ): Promise<ParsePdfResponse> {
        const res = await this.queue<ParsePdfMessage>({
            type: "parse.pdf",
            filename,
        })
        return res.response
    }

    async startScript(
        script: string,
        files: string[],
        options: PromptScriptRunOptions
    ): Promise<PromptScriptTestRunResponse> {
        const res = await this.queue<PromptScriptStart>({
            type: "script.start",
            script,
            files,
            options,
        })
        return res.response
    }

    async abortScript(runId: string, reason?: string): Promise<ResponseStatus> {
        const res = await this.queue<PromptScriptAbort>({
            type: "script.abort",
            runId,
            reason,
        })
        return res.response
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

    async containerStart(
        options: ContainerOptions
    ): Promise<ContainerStartResponse> {
        const res = await this.queue<ContainerStart>({
            type: "container.start",
            options,
        })
        return res.response
    }

    async containerRemove(): Promise<void> {
        await this.queue<ContainerRemove>({
            type: "container.remove",
        })
    }

    kill(): void {
        if (this._ws?.readyState === WebSocket.OPEN)
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
