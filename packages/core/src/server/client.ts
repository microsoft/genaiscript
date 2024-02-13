import { RetreivalSearchResponse } from "../host"
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

export async function startClient() {
    const awaiters: Record<
        string,
        { resolve: (data: any) => void; reject: (error: unknown) => void }
    > = {}
    const ws = new WebSocket("http://localhost:3000")
    ws.addEventListener("message", async (event) => {
        const { data }: { data: RequestMessages } = event
        const { id } = data
        const awaiter = awaiters[id]
        if (awaiter) {
            delete awaiters[id]
            await awaiter.resolve(data)
        }
    })
    ws.addEventListener("close", () => {
        Object.values(awaiters).forEach((a) => a.reject("connection closed"))
    })

    let _nextId = 1
    const queue = <T extends RequestMessage>(msg: Omit<T, "id">) =>
        new Promise<T>((resolve, reject) => {
            const id = _nextId++ + ""
            awaiters[id] = { resolve: (data) => resolve(data), reject }
            ws.send(JSON.stringify({ ...msg, id }))
        })

    const clear = async () =>
        await queue(<RetreivalClear>{ type: "retreival.clear" })
    const search = async (text: string): Promise<RetreivalSearch> =>
        await queue(<RetreivalSearch>{ type: "retreival.search", text })
    const upsert = async (filename: string, content: Blob) =>
        await queue(<RetreivalUpsert>{
            type: "retreival.upsert",
            filename,
            content: await blobToBase64(content),
        })

    return { clear, search, upsert }
}
