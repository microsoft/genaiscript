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
    AbortSignalCancellationController,
    MarkdownTrace,
    TRACE_CHUNK,
    TraceChunkEvent,
    UNHANDLED_ERROR_CODE,
    isCancelError,
    USER_CANCELLED_ERROR_CODE,
    PromptScriptProgressResponseEvent,
    PromptScriptEndResponseEvent,
} from "genaiscript-core"
import { runPromptScriptTests } from "./test"
import { PROMPTFOO_VERSION } from "./version"
import { runScript } from "./run"
import { isAccessor } from "typescript"

export async function startServer(options: { port: string }) {
    const port = parseInt(options.port) || SERVER_PORT
    const wss = new WebSocketServer({ port })

    const runs: Record<
        string,
        {
            canceller: AbortSignalCancellationController
            trace: MarkdownTrace
            runner: Promise<void>
        }
    > = {}

    const cancelAll = () => {
        for (const [runId, run] of Object.entries(runs)) {
            console.log(`abort run ${runId}`)
            run.canceller.abort("closing")
            delete runs[runId]
        }
    }

    // cleanup runs
    wss.on("close", () => {
        cancelAll()
    })
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
                    case "script.start": {
                        cancelAll()

                        const { script, files, options, runId } = data
                        const canceller =
                            new AbortSignalCancellationController()
                        const trace = new MarkdownTrace()
                        trace.addEventListener(TRACE_CHUNK, (ev) => {
                            const tev = ev as TraceChunkEvent
                            ws?.send(
                                JSON.stringify(<
                                    PromptScriptProgressResponseEvent
                                >{
                                    type: "script.progress",
                                    runId,
                                    trace: tev.chunk,
                                })
                            )
                        })
                        console.log(`run ${runId} starting`)
                        console.log({ script, files, options })
                        const runner = runScript(script, files, {
                            ...options,
                            trace,
                            cancellationToken: canceller.token,
                        })
                            .then((exitCode) => {
                                delete runs[runId]
                                console.log(
                                    `run ${runId} completed with ${exitCode}`
                                )
                                ws?.send(
                                    JSON.stringify(<
                                        PromptScriptEndResponseEvent
                                    >{
                                        type: "script.end",
                                        runId,
                                        exitCode,
                                    })
                                )
                            })
                            .catch((e) => {
                                if (canceller.controller.signal.aborted) return
                                if (!isCancelError(e)) trace.error(e)
                                ws?.send(
                                    JSON.stringify(<
                                        PromptScriptEndResponseEvent
                                    >{
                                        type: "script.end",
                                        runId,
                                        exitCode: isAccessor(e)
                                            ? USER_CANCELLED_ERROR_CODE
                                            : UNHANDLED_ERROR_CODE,
                                    })
                                )
                            })
                        runs[runId] = {
                            runner,
                            canceller,
                            trace,
                        }
                        response = <ResponseStatus>{
                            ok: true,
                            status: 0,
                            runId,
                        }
                        break
                    }
                    case "script.abort": {
                        const { runId, reason } = data
                        console.log(`abort run ${runId}`)
                        const run = runs[runId]
                        if (run) {
                            delete runs[runId]
                            run.canceller.abort(reason)
                        }
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
