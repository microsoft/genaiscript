import { WebSocketServer } from "ws"
import { runPromptScriptTests } from "./test"
import { PROMPTFOO_VERSION } from "./version"
import { runScriptInternal } from "./run"
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
import { logVerbose, logError, assert, chunkString } from "../../core/src/util"
import { CORE_VERSION } from "../../core/src/version"
import {
    RequestMessages,
    PromptScriptProgressResponseEvent,
    PromptScriptEndResponseEvent,
    ChatStart,
    ChatChunk,
    ChatCancel,
    LanguageModelConfigurationResponse,
    promptScriptListResponse,
} from "../../core/src/server/messages"
import { envInfo } from "./info"
import { LanguageModel } from "../../core/src/chat"
import {
    ChatCompletionResponse,
    ChatCompletionsOptions,
    CreateChatCompletionRequest,
} from "../../core/src/chattypes"
import { randomHex } from "../../core/src/crypto"
import { buildProject } from "./build"
import * as http from "http"
import { join } from "path"
import { createReadStream } from "fs"

/**
 * Starts a WebSocket server for handling chat and script execution.
 * @param options - Configuration options including port and optional API key.
 */
export async function startServer(options: {
    port: string
    httpPort?: string
    apiKey?: string
}) {
    // Parse and set the server port, using a default if not specified.
    const port = parseInt(options.port) || SERVER_PORT
    const apiKey = options.apiKey ?? process.env.GENAISCRIPT_API_KEY

    const wss = new WebSocketServer({ noServer: true })

    // Stores active script runs with their cancellation controllers and traces.
    const runs: Record<
        string,
        {
            canceller: AbortSignalCancellationController
            trace: MarkdownTrace
            runner: Promise<void>
        }
    > = {}

    // Stores active chat handlers.
    const chats: Record<string, (chunk: ChatChunk) => Promise<void>> = {}

    // Cancels all active runs and chats.
    const cancelAll = () => {
        for (const [runId, run] of Object.entries(runs)) {
            logVerbose(`abort run ${runId}`)
            run.canceller.abort("closing")
            delete runs[runId]
        }
        for (const [chatId, chat] of Object.entries(chats)) {
            logVerbose(`abort chat ${chat}`)
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

    // Handles incoming chat chunks and calls the appropriate handler.
    const handleChunk = async (chunk: ChatChunk) => {
        const handler = chats[chunk.chatId]
        if (handler) {
            if (chunk.finishReason) delete chats[chunk.chatId]
            await handler(chunk)
        }
    }

    const checkApiKey = (req: http.IncomingMessage) => {
        if (apiKey) {
            const url = req.url.replace(/^[^\?]*\?/, "")
            const search = new URLSearchParams(url)
            const hash = search.get("api-key")
            if (req.headers.authorization !== apiKey && hash !== apiKey) {
                logError(`clients: connection unauthorized ${url}, ${hash}`)
                logVerbose(`url:${req.url}`)
                logVerbose(`api:${apiKey}`)
                logVerbose(`auth:${req.headers.authorization}`)
                logVerbose(`hash:${hash}`)
                return false
            }
        }
        return true
    }

    // Configures the client language model with a completer function.
    host.clientLanguageModel = Object.freeze<LanguageModel>({
        id: MODEL_PROVIDER_CLIENT,
        completer: async (
            req: CreateChatCompletionRequest,
            connection: LanguageModelConfiguration,
            options: ChatCompletionsOptions,
            trace: MarkdownTrace
        ): Promise<ChatCompletionResponse> => {
            const { messages, model } = req
            const { partialCb, inner } = options
            if (!wss.clients?.size) throw new Error("no llm clients connected")

            return new Promise<ChatCompletionResponse>((resolve, reject) => {
                let responseSoFar: string = ""
                let tokensSoFar: number = 0
                let finishReason: ChatCompletionResponse["finishReason"]

                // Add a handler for chat responses.
                const chatId = randomHex(6)
                chats[chatId] = async (chunk) => {
                    if (!responseSoFar && chunk.model) {
                        logVerbose(`chat model ${chunk.model}`)
                        trace.itemValue("chat model", chunk.model)
                        trace.appendContent("\n\n")
                    }
                    trace.appendToken(chunk.chunk)
                    responseSoFar += chunk.chunk ?? ""
                    tokensSoFar += chunk.tokens ?? 0
                    partialCb?.({
                        tokensSoFar,
                        responseSoFar,
                        responseChunk: chunk.chunk,
                        inner,
                    })
                    finishReason = chunk.finishReason as any
                    if (finishReason) {
                        trace.appendContent("\n\n")
                        trace.itemValue(`finish reason`, finishReason)
                        delete chats[chatId]
                        if (chunk.error) {
                            trace.error(undefined, chunk.error)
                            reject(chunk.error)
                        } else resolve({ text: responseSoFar, finishReason })
                    }
                }

                // Send request to LLM clients.
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

    // Handle server shutdown by cancelling all activities.
    wss.on("close", () => {
        cancelAll()
    })

    // Manage new WebSocket connections.
    wss.on("connection", function connection(ws, req) {
        logVerbose(`clients: connected (${wss.clients.size} clients)`)
        ws.on("error", console.error)
        ws.on("close", () =>
            logVerbose(`clients: closed (${wss.clients.size} clients)`)
        )

        // Handle incoming messages based on their type.
        ws.on("message", async (msg) => {
            const data = JSON.parse(msg.toString()) as RequestMessages
            const { id, type } = data
            let response: ResponseStatus
            try {
                switch (type) {
                    // Handle version request
                    case "server.version": {
                        logVerbose(`server: version ${CORE_VERSION}`)
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
                    // Handle environment request
                    case "server.env": {
                        logVerbose(`server: env`)
                        envInfo(undefined)
                        response = <ServerResponse>{
                            ok: true,
                        }
                        break
                    }
                    // Handle server kill request
                    case "server.kill": {
                        logVerbose(`server: kill`)
                        process.exit(0)
                        break
                    }
                    // Handle model configuration request
                    case "model.configuration": {
                        const { model, token } = data
                        logVerbose(`model: lookup configuration ${model}`)
                        try {
                            const info =
                                await host.getLanguageModelConfiguration(
                                    model,
                                    { token }
                                )
                            response = <LanguageModelConfigurationResponse>{
                                ok: true,
                                info,
                            }
                        } catch (e) {
                            response = <LanguageModelConfigurationResponse>{
                                ok: false,
                            }
                        }
                        break
                    }
                    case "script.list": {
                        logVerbose(`project: list scripts`)
                        const project = await buildProject()
                        logVerbose(
                            `project: found ${project?.scripts?.length || 0} scripts`
                        )
                        response = <promptScriptListResponse>{
                            ok: true,
                            status: 0,
                            project,
                        }
                        break
                    }
                    // Handle test run request
                    case "tests.run": {
                        logVerbose(
                            `tests: run ${data.scripts?.join(", ") || "*"}`
                        )
                        await runtimeHost.readConfig()
                        response = await runPromptScriptTests(data.scripts, {
                            ...(data.options || {}),
                            //cache: true,
                            verbose: true,
                            promptfooVersion: PROMPTFOO_VERSION,
                        })
                        break
                    }
                    // Handle script start request
                    case "script.start": {
                        // Cancel any active scripts
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
                            chunkString(tev.chunk, 2 << 14).forEach((c) =>
                                send({ trace: c })
                            )
                        })
                        logVerbose(`run ${runId}: starting ${script}`)
                        await runtimeHost.readConfig()
                        const runner = runScriptInternal(script, files, {
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
                                responseTokens,
                            }) => {
                                send({
                                    response: responseSoFar,
                                    responseChunk,
                                    tokens: tokensSoFar,
                                    responseTokens,
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
                                logError(`\nrun ${runId}: failed`)
                                logError(e)
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
                    // Handle script abort request
                    case "script.abort": {
                        const { runId, reason } = data
                        logVerbose(`run ${runId}: abort`)
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
                    // Handle chat chunk requests
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

    // Create an HTTP server to handle basic requests.
    const httpServer = http.createServer((req, res) => {
        if (req.url === "/") {
            res.setHeader("Content-Type", "text/html")
            res.statusCode = 200
            const filePath = join(__dirname, "index.html")
            const stream = createReadStream(filePath)
            stream.pipe(res)
        } else if (req.url === "/built/web.mjs") {
            res.setHeader("Content-Type", "application/javascript")
            res.statusCode = 200
            const filePath = join(__dirname, "web.mjs")
            const stream = createReadStream(filePath)
            stream.pipe(res)
        } else if (req.url === "/favicon.svg") {
            res.setHeader("Content-Type", "image/svg+xml")
            res.statusCode = 200
            const filePath = join(__dirname, "favicon.svg")
            const stream = createReadStream(filePath)
            stream.pipe(res)
        } else {
            console.debug(`404: ${req.url}`)
            res.statusCode = 404
            res.end()
        }
    })
    // Upgrade HTTP server to handle WebSocket connections on the /wss route.
    httpServer.on("upgrade", (req, socket, head) => {
        const pathname = new URL(req.url, `http://${req.headers.host}`).pathname
        console.log({ upgrade: pathname })
        if (pathname === "/" && checkApiKey(req)) {
            wss.handleUpgrade(req, socket, head, (ws) => {
                wss.emit("connection", ws, req)
            })
        }
        // abort
        socket.destroy()
    })
    // Start the HTTP server on the specified port.
    httpServer.listen(port, () => {
        console.log(
            `GenAIScript server v${CORE_VERSION} at http://127.0.0.1:${port}/`
        )
        if (apiKey) console.debug(`apikey: ${apiKey.slice(0, 4) + "..."}`)
    })
}
