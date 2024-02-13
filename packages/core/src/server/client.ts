import { SERVER_PORT } from "../constants"
import {
    Host,
    ResponseStatus,
    RetreivalSearchResponse,
    RetreivalService,
} from "../host"
import {
    RequestMessage,
    RequestMessages,
    RetreivalClear,
    RetreivalSearch,
    RetreivalUpsert,
} from "./messages"

function blobToBase64(blob: Blob) {
    return new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = function () {
            let base64data = reader.result
            resolve(base64data as string)
        }
        reader.readAsDataURL(blob)
    })
}

export class WebSocketRetreivalService implements RetreivalService {
    private awaiters: Record<
        string,
        { resolve: (data: any) => void; reject: (error: unknown) => void }
    > = {}
    private _nextId = 1
    private ws: WebSocket
    constructor(readonly url: string) {}

    async init() {
        if (this.ws) return

        this.ws = new WebSocket(this.url)
        this.ws.addEventListener("message", async (event) => {
            const { data }: { data: RequestMessages } = event
            const { id } = data
            const awaiter = this.awaiters[id]
            if (awaiter) {
                delete this.awaiters[id]
                await awaiter.resolve(data)
            }
        })
        this.ws.addEventListener("close", () => {
            this.cancel()
        })
    }

    private queue<T extends RequestMessage>(msg: Omit<T, "id">): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            const id = this._nextId++ + ""
            this.awaiters[id] = { resolve: (data) => resolve(data), reject }
            this.ws.send(JSON.stringify({ ...msg, id }))
        })
    }

    cancel() {
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
        })
        return res.response
    }

    dispose(): any {
        if (this.ws) {
            this.ws.close()
            this.ws = undefined
        }
        this.cancel()
        return undefined
    }
}

export function createRetreivalClient(host: Host): WebSocketRetreivalService {
    const port = SERVER_PORT
    const url = `http://localhost:${port}`
    const client = new WebSocketRetreivalService(url)
    return client
}
