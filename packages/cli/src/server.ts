import { WebSocketServer } from "ws"
import {
    RequestMessages,
    ResponseStatus,
    SERVER_PORT,
    host,
    YAMLStringify,
    logError,
    CORE_VERSION,
    ServerResponse,
    serializeError,
    ShellExecResponse,
    ContainerStartResponse,
    DOCKER_DEFAULT_IMAGE,
} from "genaiscript-core"
import { runPromptScriptTests } from "./test"
import { PROMPTFOO_VERSION } from "./version"

export async function startServer(options: { port: string }) {
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
                    case "server.version": {
                        console.log(`server: version ${CORE_VERSION}`)
                        response = <ServerResponse>{
                            ok: true,
                            version: CORE_VERSION,
                            node: process.version,
                            platform: process.platform,
                            arch: process.arch,
                            pid: process.pid,
                        }
                        break
                    }
                    case "server.kill": {
                        console.log(`server: kill`)
                        process.exit(0)
                        break
                    }
                    case "models.pull": {
                        console.log(`models: pull ${data.model}`)
                        response = await host.models.pullModel(data.model)
                        break
                    }
                    case "retrieval.vectorClear":
                        console.log(`retrieval: clear`)
                        await host.retrieval.init()
                        response = await host.retrieval.vectorClear(
                            data.options
                        )
                        break
                    case "retrieval.vectorUpsert": {
                        console.log(`retrieval: upsert ${data.filename}`)
                        await host.retrieval.init()
                        response = await host.retrieval.vectorUpsert(
                            data.filename,
                            data.options
                        )
                        break
                    }
                    case "retrieval.vectorSearch": {
                        console.log(`retrieval: search ${data.text}`)
                        console.debug(YAMLStringify(data.options))
                        await host.retrieval.init()
                        response = await host.retrieval.vectorSearch(
                            data.text,
                            data.options
                        )
                        console.debug(YAMLStringify(response))
                        break
                    }
                    case "parse.pdf": {
                        console.log(`parse: pdf ${data.filename}`)
                        await host.parser.init()
                        response = await host.parser.parsePdf(data.filename)
                        break
                    }
                    case "tests.run": {
                        console.log(
                            `tests: run ${data.scripts?.join(", ") || "*"}`
                        )
                        response = await runPromptScriptTests(data.scripts, {
                            ...(data.options || {}),
                            cache: true,
                            verbose: true,
                            promptfooVersion: PROMPTFOO_VERSION,
                        })
                        break
                    }
                    case "shell.exec": {
                        console.log(`exec ${data.command}`)
                        const { command, args, options, containerId } = data
                        const value = await host.exec(
                            containerId,
                            command,
                            args,
                            options
                        )
                        response = <ShellExecResponse>{
                            value,
                            ok: !value.failed,
                            status: value.exitCode,
                        }
                        break
                    }
                    case "container.start": {
                        console.log(
                            `container: start ${data.options.image || DOCKER_DEFAULT_IMAGE}`
                        )
                        const container = await host.container(data.options)
                        response = <ContainerStartResponse>{
                            ok: true,
                            id: container.id,
                            hostPath: container.hostPath,
                            containerPath: container.containerPath,
                            disablePurge: container.disablePurge,
                        }
                        break
                    }
                    case "container.remove": {
                        // console.log(`container: remove all`)
                        await host.removeContainers()
                        response = { ok: true }
                        break
                    }
                    default:
                        throw new Error(`unknown message type ${type}`)
                }
            } catch (e) {
                response = { ok: false, error: serializeError(e) }
            } finally {
                if (response.error) logError(response.error)
                ws.send(JSON.stringify({ id, response }))
            }
        })
    })
    console.log(`GenAIScript server started on port ${port}`)
}
