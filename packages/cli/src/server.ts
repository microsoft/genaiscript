import { WebSocketServer } from "ws"
import http from "http"
import {
    RequestMessages,
    ResponseStatus,
    SERVER_PORT,
    host,
} from "genaiscript-core"

async function b64toBlob(base64: string, type = "application/octet-stream") {
    const res = await fetch(`data:${type};base64,${base64}`)
    const blob = await res.blob()
    return blob
}

export function startServer(options: { port: string }) {
    const port = parseInt(options.port) || SERVER_PORT
    const wss = new WebSocketServer({ port })

    wss.on("connection", function connection(ws) {
        console.log(`client connected (${wss.clients.size} clients)`)
        ws.on("error", console.error)
        ws.on("message", async (msg) => {
            const data = JSON.parse(msg.toString()) as RequestMessages
            const { id, type } = data
            let response: ResponseStatus
            try {
                switch (type) {
                    case "retreival.clear":
                        console.log(`retreival: clear`)
                        response = await host.retreival.clear()
                        break
                    case "retreival.upsert":
                        console.log(`upsert ${data.filename}`)
                        response = await host.retreival.upsert(
                            data.filename,
                            await b64toBlob(data.content)
                        )
                        break
                    case "retreival.search":
                        console.log(`retreival: search ${data.text}`)
                        response = await host.retreival.search(data.text)
                        break
                    default:
                        throw new Error(`unknown message type ${type}`)
                }
                response.ok = true
            } catch (e) {
                response = { ok: false, error: e.message }
            } finally {
                ws.send(JSON.stringify({ id, response }))
            }
        })
    })
    console.log(`GenAIScript server started on port ${port}`)
}
