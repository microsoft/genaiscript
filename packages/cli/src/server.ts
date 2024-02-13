import { WebSocketServer } from "ws"
import http from "http"
import {
    RequestMessages,
    ResponseStatus,
    RetreivalSearchResponse,
    host,
} from "genaiscript-core"

export function startServer() {
    const port = 3000
    const wss = new WebSocketServer({ port })

    wss.on("connection", function connection(ws) {
        ws.on("error", console.error)
        ws.on("message", async (msg) => {
            const data = JSON.parse(msg.toString()) as RequestMessages
            const { id, type } = data
            let response: ResponseStatus
            try {
                switch (type) {
                    case "retreival.clear":
                        response = await host.retreival.clear()
                        break
                    case "retreival.upsert":
                        response = await host.retreival.upsert(
                            data.filename,
                            data.content
                        )
                        break
                    case "retreival.search":
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
        ws.send("something")
    })
}
