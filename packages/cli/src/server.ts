import { WebSocketServer } from "ws"
import {
    RequestMessages,
    ResponseStatus,
    SERVER_PORT,
    host,
    YAMLStringify,
    logError,
} from "genaiscript-core"

async function b64toBlob(base64: string, type: string) {
    const res = await fetch(`data:${type};base64,${base64}`)
    const blob = await res.blob()
    return blob
}

export async function startServer(options: { port: string }) {
    await host.retreival.init()

    const port = parseInt(options.port) || SERVER_PORT
    const wss = new WebSocketServer({ port })

    wss.on("connection", function connection(ws) {
        console.log(`clients: connected (${wss.clients.size} clients)`)
        ws.on("error", console.error)
        ws.on("close", () =>
            console.log(`clients: closed (${wss.clients.size} clients)`)
        )
        ws.on("message", async (msg) => {
            const data = JSON.parse(msg.toString()) as RequestMessages
            const { id, type } = data
            let response: ResponseStatus
            try {
                switch (type) {
                    case "server.kill": {
                        console.log(`server: kill`)
                        process.exit(0)
                        break
                    }
                    case "retreival.clear":
                        console.log(`retreival: clear`)
                        response = await host.retreival.clear()
                        break
                    case "retreival.upsert":
                        console.log(`retreival: upsert ${data.filename}`)
                        response = await host.retreival.upsert(
                            data.filename,
                            data.content,
                            data.mimeType
                        )
                        break
                    case "retreival.query":
                        console.log(`retreival: query ${data.text}`)
                        console.debug(YAMLStringify(data.options))
                        response = await host.retreival.query(
                            data.text,
                            data.options
                        )
                        break
                    case "retreival.search":
                        console.log(`retreival: search ${data.text}`)
                        console.debug(YAMLStringify(data.options))
                        response = await host.retreival.search(
                            data.text,
                            data.options
                        )
                        break
                    default:
                        throw new Error(`unknown message type ${type}`)
                }
                response.ok = true
            } catch (e) {
                response = { ok: false, error: e.message }
            } finally {
                if (response.error) logError(response.error)
                ws.send(JSON.stringify({ id, response }))
            }
        })
    })
    console.log(`GenAIScript server started on port ${port}`)
}
