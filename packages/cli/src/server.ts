import { WebSocketServer } from "ws"
import { runPromptScriptTests } from "./test"
import { PROMPTFOO_VERSION } from "./version"
import { runScript } from "./run"
import { AbortSignalCancellationController } from "../../core/src/cancellation"
import {
    SERVER_PORT,
    TRACE_CHUNK,
    USER_CANCELLED_ERROR_CODE,
    UNHANDLED_ERROR_CODE,
    DOCKER_DEFAULT_IMAGE,
} from "../../core/src/constants"
import {
    isCancelError,
    errorMessage,
    serializeError,
} from "../../core/src/error"
import {
    ResponseStatus,
    ServerResponse,
    runtimeHost,
} from "../../core/src/host"
import { MarkdownTrace, TraceChunkEvent } from "../../core/src/trace"
import { logVerbose, logError } from "../../core/src/util"
import { CORE_VERSION } from "../../core/src/version"
import { YAMLStringify } from "../../core/src/yaml"
import {
    RequestMessages,
    PromptScriptProgressResponseEvent,
    PromptScriptEndResponseEvent,
    ShellExecResponse,
} from "../../core/src/server/messages"
import { envInfo } from "./info"

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
                    case "server.env": {
                        console.log(`server: env`)
                        envInfo(undefined)
                        response = <ServerResponse>{
                            ok: true,
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
                        response = await runtimeHost.models.pullModel(
                            data.model
                        )
                        break
                    }
                    case "retrieval.vectorClear":
                        console.log(`retrieval: clear`)
                        await runtimeHost.retrieval.init()
                        response = await runtimeHost.retrieval.vectorClear(
                            data.options
                        )
                        break
                    case "retrieval.vectorUpsert": {
                        console.log(`retrieval: upsert ${data.filename}`)
                        await runtimeHost.retrieval.init()
                        response = await runtimeHost.retrieval.vectorUpsert(
                            data.filename,
                            data.options
                        )
                        break
                    }
                    case "retrieval.vectorSearch": {
                        console.log(`retrieval: search ${data.text}`)
                        console.debug(YAMLStringify(data.options))
                        await runtimeHost.retrieval.init()
                        response = await runtimeHost.retrieval.vectorSearch(
                            data.text,
                            data.options
                        )
                        console.debug(YAMLStringify(response))
                        break
                    }
                    case "parse.pdf": {
                        console.log(`parse: pdf ${data.filename}`)
                        await runtimeHost.parser.init()
                        response = await runtimeHost.parser.parsePdf(
                            data.filename
                        )
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

                        const { script, files = [], options = {}, runId } = data
                        const canceller =
                            new AbortSignalCancellationController()
                        const trace = new MarkdownTrace()
                        const send = (
                            payload: Omit<
                                PromptScriptProgressResponseEvent,
                                "type" | "runId"
                            >
                        ) =>
                            ws?.send(
                                JSON.stringify(<
                                    PromptScriptProgressResponseEvent
                                >{
                                    type: "script.progress",
                                    runId,
                                    ...payload,
                                })
                            )
                        trace.addEventListener(TRACE_CHUNK, (ev) => {
                            const tev = ev as TraceChunkEvent
                            send({ trace: tev.chunk })
                        })
                        logVerbose(`run ${runId}: starting`)
                        logVerbose(YAMLStringify({ script, files, options }))
                        const runner = runScript(script, files, {
                            ...options,
                            trace,
                            cancellationToken: canceller.token,
                            infoCb: ({ text }) => {
                                send({ progress: text })
                            },
                            partialCb: ({
                                responseChunk,
                                responseSoFar,
                                tokensSoFar,
                            }) => {
                                send({
                                    response: responseSoFar,
                                    responseChunk,
                                    tokens: tokensSoFar,
                                })
                            },
                        })
                            .then(({ exitCode, result }) => {
                                delete runs[runId]
                                logVerbose(
                                    `\nrun ${runId}: completed with ${exitCode}`
                                )
                                ws?.send(
                                    JSON.stringify(<
                                        PromptScriptEndResponseEvent
                                    >{
                                        type: "script.end",
                                        runId,
                                        exitCode,
                                        result,
                                    })
                                )
                            })
                            .catch((e) => {
                                if (canceller.controller.signal.aborted) return
                                if (!isCancelError(e)) trace.error(e)
                                logVerbose(
                                    `\nrun ${runId}: failed with ${errorMessage(e)}`
                                )
                                ws?.send(
                                    JSON.stringify(<
                                        PromptScriptEndResponseEvent
                                    >{
                                        type: "script.end",
                                        runId,
                                        exitCode: isCancelError(e)
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
                        const value = await runtimeHost.exec(
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
