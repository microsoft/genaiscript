import { CLIENT_RECONNECT_DELAY } from "../constants"
import {
    ParsePdfResponse,
    ParseService,
    ResponseStatus,
    RetrievalOptions,
    RetrievalSearchOptions,
    RetrievalSearchResponse,
    RetrievalService,
    RetrievalUpsertOptions,
    host,
} from "../host"
import { TraceOptions } from "../trace"
import { assert } from "../util"
import {
    ParsePdfMessage,
    RequestMessage,
    RequestMessages,
    RetrievalClear,
    RetrievalSearch,
    RetrievalUpsert,
    ServerVersion,
    TestRunMessage,
    PromptScriptTestRunOptions,
} from "./messages"

export class WebSocketClient implements RetrievalService, ParseService {
    private awaiters: Record<
        string,
        { resolve: (data: any) => void; reject: (error: unknown) => void }
    > = {}
    private _nextId = 1
    private _ws: WebSocket
    private _pendingMessages: string[] = []
    private _reconnectTimeout: ReturnType<typeof setTimeout> | undefined

    constructor(readonly url: string) {}

    async init(): Promise<void> {
        if (this._ws) return Promise.resolve(undefined)
        await host.server.start()
        return this.connect()
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
        this._ws.addEventListener("error", () => this.reconnect())
        this._ws.addEventListener("close", () => this.reconnect())
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
        return new Promise<T>((resolve, reject) => {
            const id = this._nextId++ + ""
            this.awaiters[id] = { resolve: (data) => resolve(data), reject }
            const m = JSON.stringify({ ...msg, id })
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

    cancel() {
        this._pendingMessages = []
        const cancellers = Object.values(this.awaiters)
        this.awaiters = {}
        cancellers.forEach((a) => a.reject("cancelled"))
    }

    async version(): Promise<string> {
        const res = await this.queue<ServerVersion>({ type: "server.version" })
        return res.version
    }

    async clear(options: RetrievalOptions): Promise<ResponseStatus> {
        const res = await this.queue<RetrievalClear>({
            type: "retrieval.clear",
            options,
        })
        return res.response
    }

    async search(
        text: string,
        options?: RetrievalSearchOptions
    ): Promise<RetrievalSearchResponse> {
        const res = await this.queue<RetrievalSearch>({
            type: "retrieval.search",
            text,
            options,
        })
        return res.response
    }
    async upsert(filename: string, options?: RetrievalUpsertOptions) {
        const res = await this.queue<RetrievalUpsert>({
            type: "retrieval.upsert",
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

    async runTest(script: PromptScript, options: PromptScriptTestRunOptions) {
        const res = await this.queue<TestRunMessage>({
            type: "tests.run",
            scripts: script?.id ? [script?.id] : undefined,
            options,
        })
        return res.response
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
