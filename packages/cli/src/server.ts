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
    MODEL_PROVIDER_CLIENT,
} from "../../core/src/constants"
import {
    isCancelError,
    errorMessage,
    serializeError,
} from "../../core/src/error"
import {
    LanguageModelConfiguration,
    ResponseStatus,
    ServerResponse,
    host,
    runtimeHost,
} from "../../core/src/host"
import { MarkdownTrace, TraceChunkEvent } from "../../core/src/trace"
import { logVerbose, logError, assert } from "../../core/src/util"
import { CORE_VERSION } from "../../core/src/version"
import {
    RequestMessages,
    PromptScriptProgressResponseEvent,
    PromptScriptEndResponseEvent,
    ShellExecResponse,
    ChatStart,
    ChatChunk,
    ChatCancel,
} from "../../core/src/server/messages"
import { envInfo } from "./info"
import { LanguageModel } from "../../core/src/chat"
import {
    ChatCompletionResponse,
    ChatCompletionsOptions,
    CreateChatCompletionRequest,
} from "../../core/src/chattypes"
import { randomHex } from "../../core/src/crypto"

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
    const chats: Record<string, (chunk: ChatChunk) => Promise<void>> = {}

    const cancelAll = () => {
        for (const [runId, run] of Object.entries(runs)) {
            console.log(`abort run ${runId}`)
            run.canceller.abort("closing")
            delete runs[runId]
        }
        for (const [chatId, chat] of Object.entries(chats)) {
            console.log(`abort chat ${chat}`)
            for (const ws of wss.clients) {
                ws.send(
                    JSON.stringify(<ChatCancel>{
                        type: "chat.cancel",
                        chatId,
                    })
                )
                break
            }

            delete chats[chatId]
        }
    }

    const handleChunk = async (chunk: ChatChunk) => {
        const handler = chats[chunk.chatId]
        if (handler) {
            if (chunk.finishReason) delete chats[chunk.chatId]
            await handler(chunk)
        }
    }

    host.clientLanguageModel = Object.freeze<LanguageModel>({
        id: MODEL_PROVIDER_CLIENT,
        completer: async (
            req: CreateChatCompletionRequest,
            connection: LanguageModelConfiguration,
            options: ChatCompletionsOptions,
            trace: MarkdownTrace
        ): Promise<ChatCompletionResponse> => {
            const { messages, model } = req
            const { partialCb } = options
            if (!wss.clients.size) throw new Error("no llm clients connected")

            return new Promise<ChatCompletionResponse>((resolve, reject) => {
                let responseSoFar: string = ""
                let tokensSoFar: number = 0
                let finishReason: ChatCompletionResponse["finishReason"]

                // add handler
                const chatId = randomHex(6)
                chats[chatId] = async (chunk) => {
                    if (!responseSoFar) {
                        trace.itemValue("model", chunk.model)
                        trace.appendContent("\n\n")
                    }
                    trace.appendToken(chunk.chunk)
                    responseSoFar += chunk.chunk ?? ""
                    tokensSoFar += chunk.tokens ?? 0
                    partialCb?.({
                        tokensSoFar,
                        responseSoFar,
                        responseChunk: chunk.chunk,
                    })
                    finishReason = chunk.finishReason as any
                    if (finishReason) {
                        trace.appendContent("\n\n")
                        trace.itemValue(`finish reason`, finishReason)
                        delete chats[chatId]
                        resolve({ text: responseSoFar, finishReason })
                    }
                }

                // ask for LLM
                const msg = JSON.stringify(<ChatStart>{
                    type: "chat.start",
                    chatId,
                    model,
                    messages,
                })
                for (const ws of wss.clients) {
                    ws.send(msg)
                    break
                }
            })
        },
    })

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
                        console.log(`run ${runId}: abort`)
                        const run = runs[runId]
                        if (run) {
                            delete runs[runId]
                            run.canceller.abort(reason)
                        }
                        response = <ResponseStatus>{
                            ok: true,
                            status: 0,
                            runId,
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
                    case "chat.chunk": {
                        await handleChunk(data)
                        response = <ResponseStatus>{ ok: true }
                        break
                    }
                    default:
                        throw new Error(`unknown message type ${type}`)
                }
            } catch (e) {
                response = { ok: false, error: serializeError(e) }
            } finally {
                assert(!!response)
                if (response.error) logError(response.error)
                ws.send(JSON.stringify({ id, response }))
            }
        })
    })
    console.log(`GenAIScript server started on port ${port}`)
}
