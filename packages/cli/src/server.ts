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
import { isCancelError, serializeError } from "../../core/src/error"
import { host, runtimeHost } from "../../core/src/host"
import { MarkdownTrace, TraceChunkEvent } from "../../core/src/trace"
import {
    logVerbose,
    logError,
    assert,
    chunkString,
    logInfo,
} from "../../core/src/util"
import { CORE_VERSION } from "../../core/src/version"
import {
    RequestMessages,
    PromptScriptProgressResponseEvent,
    PromptScriptEndResponseEvent,
    ChatStart,
    ChatChunk,
    ChatCancel,
    LanguageModelConfigurationResponse,
    PromptScriptListResponse,
    ResponseStatus,
    LanguageModelConfiguration,
    ServerEnvResponse,
    ServerResponse,
} from "../../core/src/server/messages"
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
import { URL } from "url"
import { resolveLanguageModelConfigurations } from "../../core/src/config"
import { networkInterfaces } from "os"
import { GitClient } from "../../core/src/git"
import { exists } from "fs-extra"
import { deleteUndefinedValues } from "../../core/src/cleaners"

/**
 * Starts a WebSocket server for handling chat and script execution.
 * @param options - Configuration options including port and optional API key.
 */
export async function startServer(options: {
    port: string
    httpPort?: string
    apiKey?: string
    cors?: string
    network?: boolean
    remote?: string
    remoteBranch?: string
    remoteForce?: boolean
    remoteInstall?: boolean
    dispatchProgress?: boolean
}) {
    // Parse and set the server port, using a default if not specified.
    const corsOrigin = options.cors || process.env.GENAISCRIPT_CORS_ORIGIN
    const port = parseInt(options.port) || SERVER_PORT
    const apiKey = options.apiKey || process.env.GENAISCRIPT_API_KEY
    const serverHost = options.network ? "0.0.0.0" : "127.0.0.1"
    const remote = options.remote
    const dispatchProgress = !!options.dispatchProgress

    // store original working directory
    const cwd = process.cwd()

    if (remote) {
        const git = new GitClient(".")
        const res = await git.shallowClone(remote, {
            branch: options.remoteBranch,
            force: options.remoteForce,
            install: options.remoteInstall,
        })
        // change cwd to the clone repo
        process.chdir(res.cwd)
        logInfo(`remote clone: ${res.cwd}`)
    }

    const wss = new WebSocketServer({ noServer: true })

    // Stores active script runs with their cancellation controllers and traces.
    let lastRunResult: PromptScriptEndResponseEvent & {
        trace: string
    } = undefined
    const runs: Record<
        string,
        {
            canceller: AbortSignalCancellationController
            trace: MarkdownTrace
            outputTrace: MarkdownTrace
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
        if (!apiKey) return true

        const { authorization } = req.headers
        if (authorization === apiKey) return true

        const url = req.url.replace(/^[^\?]*\?/, "")
        const search = new URLSearchParams(url)
        const hash = search.get("api-key")
        if (hash === apiKey) return true

        logError(`clients: connection unauthorized ${url}`)
        logVerbose(`url :${req.url}`)
        logVerbose(`key :${apiKey}`)
        logVerbose(`auth:${authorization}`)
        logVerbose(`hash:${hash}`)
        return false
    }

    const serverVersion = () =>
        ({
            ok: true,
            version: CORE_VERSION,
            node: process.version,
            platform: process.platform,
            arch: process.arch,
            pid: process.pid,
        }) satisfies ServerResponse

    const serverEnv = async () =>
        deleteUndefinedValues({
            ok: true,
            providers: await resolveLanguageModelConfigurations(undefined, {
                token: false,
                error: true,
            }),
            remote: remote
                ? {
                      url: remote,
                      branch: options.remoteBranch,
                  }
                : undefined,
        }) satisfies ServerEnvResponse

    const scriptList = async () => {
        logVerbose(`project: list scripts`)
        const project = await buildProject()
        const scripts = project?.scripts || []
        logVerbose(
            `project: found ${scripts.filter((s) => !s.unlisted).length} scripts`
        )
        return <PromptScriptListResponse>{
            ok: true,
            status: 0,
            project,
        }
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

        const send = (payload: object) => {
            const cmsg = JSON.stringify(payload)
            if (dispatchProgress)
                for (const client of this.clients) client.send(cmsg)
            else ws?.send(cmsg)
        }
        const sendProgress = (
            runId: string,
            payload: Omit<PromptScriptProgressResponseEvent, "type" | "runId">
        ) => {
            send({
                type: "script.progress",
                runId,
                ...payload,
            } satisfies PromptScriptProgressResponseEvent)
        }

        // send traces of in-flight runs
        const activeRuns = Object.entries(runs)
        if (activeRuns.length) {
            for (const [runId, run] of activeRuns) {
                ws.send(
                    JSON.stringify({
                        type: "script.progress",
                        runId,
                        output: run.outputTrace.content,
                    } satisfies PromptScriptProgressResponseEvent)
                )
                chunkString(run.trace.content).forEach((c) =>
                    ws.send(
                        JSON.stringify({
                            type: "script.progress",
                            runId,
                            trace: c,
                        } satisfies PromptScriptProgressResponseEvent)
                    )
                )
            }
        } else if (lastRunResult) {
            const { trace, ...restResult } = lastRunResult
            chunkString(trace).forEach((c) =>
                ws.send(
                    JSON.stringify({
                        type: "script.progress",
                        runId: lastRunResult.runId,
                        trace: c,
                    } satisfies PromptScriptProgressResponseEvent)
                )
            )
            ws.send(JSON.stringify(restResult))
        }

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
                        response = serverVersion()
                        break
                    }
                    // Handle environment request
                    case "server.env": {
                        logVerbose(`server: env`)
                        response = await serverEnv()
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
                        response = await scriptList()
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
                        const outputTrace = new MarkdownTrace()
                        trace.addEventListener(TRACE_CHUNK, (ev) => {
                            const tev = ev as TraceChunkEvent
                            chunkString(tev.chunk, 2 << 14).forEach((c) =>
                                sendProgress(runId, { trace: c })
                            )
                        })
                        outputTrace.addEventListener(TRACE_CHUNK, (ev) => {
                            const tev = ev as TraceChunkEvent
                            chunkString(tev.chunk, 2 << 14).forEach((c) =>
                                sendProgress(runId, { output: c })
                            )
                        })
                        logVerbose(`run ${runId}: starting ${script}`)
                        await runtimeHost.readConfig()
                        const runner = runScriptInternal(script, files, {
                            ...options,
                            trace,
                            outputTrace,
                            cancellationToken: canceller.token,
                            infoCb: ({ text }) => {
                                sendProgress(runId, { progress: text })
                            },
                            partialCb: ({
                                responseChunk,
                                responseSoFar,
                                tokensSoFar,
                                responseTokens,
                            }) => {
                                sendProgress(runId, {
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
                                send(
                                    (lastRunResult = {
                                        type: "script.end",
                                        runId,
                                        exitCode,
                                        result,
                                        trace: trace.content,
                                    })
                                )
                            })
                            .catch((e) => {
                                if (canceller.controller.signal.aborted) return
                                if (!isCancelError(e)) trace.error(e)
                                logError(`\nrun ${runId}: failed`)
                                logError(e)
                                send({
                                    type: "script.end",
                                    runId,
                                    result: {
                                        status: "error",
                                        error: serializeError(e),
                                    },
                                    exitCode: isCancelError(e)
                                        ? USER_CANCELLED_ERROR_CODE
                                        : UNHANDLED_ERROR_CODE,
                                } satisfies PromptScriptEndResponseEvent)
                            })
                        runs[runId] = {
                            runner,
                            canceller,
                            trace,
                            outputTrace,
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
                send({ id, type, response })
            }
        })
    })

    const setCORSHeaders = (res: http.ServerResponse) => {
        res.setHeader("Access-Control-Allow-Origin", corsOrigin)
        res.setHeader("Access-Control-Allow-Methods", "OPTIONS, GET")
        res.setHeader("Access-Control-Max-Age", 24 * 3600) // 1 day
        res.setHeader(
            "Access-Control-Allow-Headers",
            "Content-Type, Authorization, Accept"
        )
    }

    // Create an HTTP server to handle basic requests.
    const httpServer = http.createServer(async (req, res) => {
        const { url, method } = req
        const route = url?.replace(/\?.*$/, "")

        if (method === "OPTIONS") {
            if (!corsOrigin) {
                res.statusCode = 405
                res.end()
            } else {
                setCORSHeaders(res)
                res.statusCode = 204
                res.end()
            }
            return
        }

        if (corsOrigin) setCORSHeaders(res)
        res.setHeader("Cache-Control", "no-store")
        if (method === "GET" && route === "/") {
            res.setHeader("Content-Type", "text/html")
            res.setHeader("Cache-Control", "no-store")
            res.statusCode = 200
            const filePath = join(__dirname, "index.html")
            const stream = createReadStream(filePath)
            stream.pipe(res)
        } else if (method === "GET" && route === "/built/markdown.css") {
            res.setHeader("Content-Type", "text/css")
            res.statusCode = 200
            const filePath = join(__dirname, "markdown.css")
            const stream = createReadStream(filePath)
            stream.pipe(res)
        } else if (method === "GET" && route === "/built/web.mjs") {
            res.setHeader("Content-Type", "application/javascript")
            res.statusCode = 200
            const filePath = join(__dirname, "web.mjs")
            const stream = createReadStream(filePath)
            stream.pipe(res)
        } else if (method === "GET" && route === "/built/web.mjs.map") {
            const filePath = join(__dirname, "web.mjs.map")
            if (await exists(filePath)) {
                res.setHeader("Content-Type", "text/json")
                res.statusCode = 200
                const stream = createReadStream(filePath)
                stream.pipe(res)
            } else {
                res.statusCode = 404
                res.end()
            }
        } else if (method === "GET" && route === "/favicon.svg") {
            res.setHeader("Content-Type", "image/svg+xml")
            res.statusCode = 200
            const filePath = join(__dirname, "favicon.svg")
            const stream = createReadStream(filePath)
            stream.pipe(res)
        } else {
            // api, validate apikey
            if (!checkApiKey(req)) {
                console.debug(`401: missing or invalid api-key`)
                res.statusCode = 401
                res.end()
                return
            }
            let response: ResponseStatus
            if (method === "GET" && route === "/api/version")
                response = serverVersion()
            else if (method === "GET" && route === "/api/scripts") {
                response = await scriptList()
            } else if (method === "GET" && route === "/api/env") {
                response = await serverEnv()
            }

            if (response === undefined) {
                console.debug(`404: ${url}`)
                res.statusCode = 404
                res.end()
            } else {
                res.statusCode = 200
                res.setHeader("Content-Type", "application/json")
                res.end(JSON.stringify(response))
            }
        }
    })
    // Upgrade HTTP server to handle WebSocket connections on the /wss route.
    httpServer.on("upgrade", (req, socket, head) => {
        const pathname = new URL(req.url, `http://${req.headers.host}`).pathname
        if (pathname === "/" && checkApiKey(req)) {
            wss.handleUpgrade(req, socket, head, (ws) => {
                wss.emit("connection", ws, req)
            })
        } else socket.destroy()
    })
    // Start the HTTP server on the specified port.
    const serverhash = apiKey ? `?api-key:${encodeURIComponent(apiKey)}` : ""
    httpServer.listen(port, serverHost, () => {
        console.log(`GenAIScript server v${CORE_VERSION}`)
        console.log(`┃ Local http://${serverHost}:${port}/${serverhash}`)
        if (options.network) {
            const interfaces = networkInterfaces()
            for (const ifaces of Object.values(interfaces)) {
                for (const iface of ifaces) {
                    if (iface.family === "IPv4" && !iface.internal) {
                        console.log(
                            `┃ Network http://${iface.address}:${port}/${serverhash}`
                        )
                    }
                }
            }
        }
    })
}
