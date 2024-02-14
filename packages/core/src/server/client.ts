import { CLIENT_RECONNECT_DELAY, SERVER_PORT } from "../constants"
import {
    Host,
    ResponseStatus,
    RetreivalSearchResponse,
    RetreivalService,
    host,
} from "../host"
import { assert } from "../util"
import {
    RequestMessage,
    RequestMessages,
    RetreivalClear,
    RetreivalSearch,
    RetreivalUpsert,
} from "./messages"

async function blobToBase64(blob: Blob): Promise<string> {
    const arrayBuffer = await new Response(blob).arrayBuffer()
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
    return base64
}

export class WebSocketClient implements RetreivalService {
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
        this._ws.addEventListener("close", () => {
            this._ws = undefined
            this.cancel()
            this._reconnectTimeout = setTimeout(() => {
                this.connect()
            }, CLIENT_RECONNECT_DELAY)
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
        return new Promise<T>((resolve, reject) => {
            const id = this._nextId++ + ""
            this.awaiters[id] = { resolve: (data) => resolve(data), reject }
            const m = JSON.stringify({ ...msg, id })
            if (this._ws?.readyState === WebSocket.OPEN) {
                console.log("send", this._ws)
                this._ws.send(m)
            } else this._pendingMessages.push(m)
        })
    }

    cancel() {
        if (this._reconnectTimeout) {
            clearTimeout(this._reconnectTimeout)
            this._reconnectTimeout = undefined
        }
        this._pendingMessages = []
        const cancellers = Object.values(this.awaiters)
        this.awaiters = {}
        cancellers.forEach((a) => a.reject("cancelled"))
    }

    async clear(): Promise<ResponseStatus> {
        const res = await this.queue(<RetreivalClear>{
            type: "retreival.clear",
        })
        return res.response
    }
    async search(text: string): Promise<RetreivalSearchResponse> {
        const res = await this.queue<RetreivalSearch>({
            type: "retreival.search",
            text,
        })
        return res.response
    }
    async upsert(filename: string, content: Blob) {
        const res = await this.queue(<RetreivalUpsert>{
            type: "retreival.upsert",
            filename,
            content: await blobToBase64(content),
            mimeType: content.type,
        })
        return res.response
    }

    kill(): void {
        if (this._ws?.readyState === WebSocket.OPEN)
            this._ws.send(
                JSON.stringify({ type: "server.kill", id: this._nextId++ + "" })
            )
        this.cancel()
    }

    dispose(): any {
        this.kill()
        if (this._ws) {
            this._ws.close()
            this._ws = undefined
        }
        this.cancel()
        return undefined
    }
}
