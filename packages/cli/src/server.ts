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
    MODEL_PROVIDER_GITHUB_COPILOT_CHAT,
    WS_MAX_FRAME_LENGTH,
    LOG,
    TRACE_FILENAME,
    WS_MAX_FRAME_CHUNK_LENGTH,
} from "../../core/src/constants"
import { isCancelError, serializeError } from "../../core/src/error"
import { host, LogEvent, runtimeHost } from "../../core/src/host"
import { MarkdownTrace, TraceChunkEvent } from "../../core/src/trace"
import { chunkLines, chunkString } from "../../core/src/chunkers"
import { logVerbose, logError, assert, logWarn } from "../../core/src/util"
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
    RunResultListResponse,
} from "../../core/src/server/messages"
import { LanguageModel } from "../../core/src/chat"
import {
    ChatCompletionResponse,
    ChatCompletionsOptions,
    CreateChatCompletionRequest,
} from "../../core/src/chattypes"
import { randomHex } from "../../core/src/crypto"
import * as http from "http"
import { extname, join } from "path"
import { createReadStream } from "fs"
import { URL } from "node:url"
import { resolveLanguageModelConfigurations } from "../../core/src/config"
import { networkInterfaces } from "os"
import { exists } from "fs-extra"
import { deleteUndefinedValues } from "../../core/src/cleaners"
import { readFile } from "fs/promises"
import { unthink } from "../../core/src/think"
import { NodeHost } from "./nodehost"
import { findRandomOpenPort, isPortInUse } from "../../core/src/net"
import { tryReadJSON, tryReadText } from "../../core/src/fs"
import { collectRuns } from "./runs"
import { generateId } from "../../core/src/id"
import { openaiApiChatCompletions, openaiApiModels } from "./openaiapi"
import { applyRemoteOptions, RemoteOptions } from "./remote"
import { nodeTryReadPackage } from "../../core/src/nodepackage"
import { genaiscriptDebug } from "../../core/src/debug"
import { startProjectWatcher } from "./watch"
import { findOpenPort } from "./port"
const dbg = genaiscriptDebug("server")

/**
 * Starts a WebSocket server for handling chat and script execution.
 *
 * @param options - Configuration options including:
 *   - port: The port to run the WebSocket server on.
 *   - httpPort: Optional HTTP port for additional services.
 *   - apiKey: Optional API key for authentication.
 *   - cors: Optional CORS configuration.
 *   - network: Whether to allow network access.
 *   - dispatchProgress: Whether to dispatch progress updates to all clients.
 *   - githubCopilotChatClient: Whether to enable GitHub Copilot Chat client integration.
 *   - remote: Remote configuration options.
 *   - remoteBranch: Optional branch name for remote configuration.
 */
export async function startServer(
    options: {
        port: string
        httpPort?: string
        apiKey?: string
        cors?: string
        network?: boolean
        dispatchProgress?: boolean
        githubCopilotChatClient?: boolean
    } & RemoteOptions
) {
    // Parse and set the server port, using a default if not specified.
    const corsOrigin = options.cors || process.env.GENAISCRIPT_CORS_ORIGIN
    const apiKey = options.apiKey || process.env.GENAISCRIPT_API_KEY
    const serverHost = options.network ? "0.0.0.0" : "127.0.0.1"
    const remote = options.remote
    const dispatchProgress = !!options.dispatchProgress

    const port = await findOpenPort(SERVER_PORT, options)
    // store original working directory
    const cwd = process.cwd()

    await applyRemoteOptions(options)
    const watcher = await startProjectWatcher({})

    // read current project info
    const { name, displayName, description, version, homepage, author } =
        (await nodeTryReadPackage()) || {}
    const readme =
        (await tryReadText("README.genai.md")) ||
        (await tryReadText("README.md"))

    const wss = new WebSocketServer({ noServer: true })

    // Stores active script runs with their cancellation controllers and traces.
    let lastRunResult: PromptScriptEndResponseEvent = undefined
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

    const toPayload = (payload: object) => {
        const msg = JSON.stringify(payload)
        if (msg.length > WS_MAX_FRAME_LENGTH) {
            throw new Error(
                `server: message too large (${msg.length} > ${WS_MAX_FRAME_LENGTH})`
            )
        }
        return msg
    }

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
                    toPayload(<ChatCancel>{
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
        if (authorization === apiKey || `Bearer ${apiKey}`) return true

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

    const serverEnv = async () => {
        return deleteUndefinedValues({
            ok: true,
            providers: (
                await resolveLanguageModelConfigurations(undefined, {
                    token: true,
                    error: true,
                    models: true,
                })
            ).map(({ token, ...rest }) => rest),
            modelAliases: runtimeHost.modelAliases,
            remote: remote
                ? {
                      url: remote,
                      branch: options.remoteBranch,
                  }
                : undefined,
            configuration: deleteUndefinedValues({
                name: displayName || name,
                description,
                version,
                homepage,
                author,
                readme,
            }),
        }) satisfies ServerEnvResponse
    }

    const scriptList = async () => {
        logVerbose(`project: list scripts`)
        const project = await watcher.project()
        const scripts = project?.scripts || []
        logVerbose(
            `project: found ${scripts.filter((s) => !s.unlisted).length} scripts (${scripts.filter((s) => !!s.unlisted).length} unlisted)`
        )
        return <PromptScriptListResponse>{
            ok: true,
            status: 0,
            project,
        }
    }

    // Configures the client language model with a completer function.
    if (options?.githubCopilotChatClient)
        runtimeHost.clientLanguageModel = Object.freeze<LanguageModel>({
            id: MODEL_PROVIDER_GITHUB_COPILOT_CHAT,
            completer: async (
                req: CreateChatCompletionRequest,
                connection: LanguageModelConfiguration,
                options: ChatCompletionsOptions,
                trace: MarkdownTrace
            ): Promise<ChatCompletionResponse> => {
                const { messages, model } = req
                const { partialCb, inner } = options
                if (!wss.clients?.size)
                    throw new Error("GitHub Copilot Chat Models not connected")

                return new Promise<ChatCompletionResponse>(
                    (resolve, reject) => {
                        let responseSoFar: string = ""
                        let tokensSoFar: number = 0
                        let finishReason: ChatCompletionResponse["finishReason"]

                        // Add a handler for chat responses.
                        const chatId = generateId()
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
                                } else
                                    resolve({
                                        text: responseSoFar,
                                        finishReason,
                                    })
                            }
                        }

                        // Send request to LLM clients.
                        const payload = toPayload(<ChatStart>{
                            type: "chat.start",
                            chatId,
                            model,
                            messages,
                        })
                        for (const ws of wss.clients) {
                            ws.send(payload)
                            break
                        }
                    }
                )
            },
        })

    // Handle server shutdown by cancelling all activities.
    wss.on("close", () => {
        cancelAll()
    })

    // send logging messages
    ;(runtimeHost as NodeHost).addEventListener(LOG, (ev) => {
        const lev = ev as LogEvent
        const messages = chunkLines(lev.message, WS_MAX_FRAME_CHUNK_LENGTH)
        for (const message of messages) {
            const payload = toPayload({
                type: "log",
                level: lev.level,
                message: message,
            })
            for (const client of wss.clients) client.send(payload)
        }
    })

    // Manage new WebSocket connections.
    wss.on("connection", function connection(ws, req) {
        logVerbose(`clients: connected (${wss.clients.size} clients)`)
        ws.on("error", console.error)
        ws.on("close", () =>
            logVerbose(`clients: closed (${wss.clients.size} clients)`)
        )

        const send = (payload: object) => {
            const cmsg = toPayload(payload)
            if (dispatchProgress)
                for (const client of wss.clients) client.send(cmsg)
            else ws?.send(cmsg)
        }
        const sendLastRunResult = () => {
            if (!lastRunResult) return
            if (
                JSON.stringify(lastRunResult).length <
                WS_MAX_FRAME_LENGTH - 200
            )
                send(lastRunResult)
            else
                send({
                    type: "script.end",
                    runId: lastRunResult.runId,
                    exitCode: lastRunResult.exitCode,
                } satisfies PromptScriptEndResponseEvent)
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
                chunkString(
                    unthink(run.outputTrace.content),
                    WS_MAX_FRAME_CHUNK_LENGTH
                ).forEach((c) =>
                    ws.send(
                        toPayload({
                            type: "script.progress",
                            runId,
                            output: c,
                        } satisfies PromptScriptProgressResponseEvent)
                    )
                )
                chunkString(
                    run.trace.content,
                    WS_MAX_FRAME_CHUNK_LENGTH
                ).forEach((c) =>
                    ws.send(
                        toPayload({
                            type: "script.progress",
                            runId,
                            trace: c,
                        } satisfies PromptScriptProgressResponseEvent)
                    )
                )
            }
        } else if (lastRunResult) {
            sendLastRunResult()
        }

        // Handle incoming messages based on their type.
        ws.on("message", async (msg) => {
            const data = JSON.parse(msg.toString()) as RequestMessages
            const { id, type } = data
            dbg(`%s: %O`, type, data)
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
                        const { script, files = [], options = {}, runId } = data
                        if (!script) throw new Error("missing script")
                        if (files.some((f) => !f))
                            throw new Error("invalid file")
                        cancelAll()
                        const canceller =
                            new AbortSignalCancellationController()
                        const cancellationToken = canceller.token
                        const trace = new MarkdownTrace({ cancellationToken })
                        const outputTrace = new MarkdownTrace({
                            cancellationToken,
                        })
                        trace.addEventListener(TRACE_CHUNK, (ev) => {
                            const tev = ev as TraceChunkEvent
                            chunkString(
                                tev.chunk,
                                WS_MAX_FRAME_CHUNK_LENGTH
                            ).forEach((c) =>
                                sendProgress(runId, {
                                    trace: c,
                                    inner: tev.inner,
                                })
                            )
                        })
                        outputTrace.addEventListener(TRACE_CHUNK, (ev) => {
                            const tev = ev as TraceChunkEvent
                            chunkString(
                                tev.chunk,
                                WS_MAX_FRAME_CHUNK_LENGTH
                            ).forEach((c) =>
                                sendProgress(runId, {
                                    output: c,
                                    inner: tev.inner,
                                })
                            )
                        })
                        logVerbose(`run ${runId}: starting ${script}`)
                        await runtimeHost.readConfig()
                        const runner = runScriptInternal(script, files, {
                            ...options,
                            runId,
                            trace,
                            runOutputTrace: outputTrace,
                            runTrace: false,
                            cancellationToken: canceller.token,
                            infoCb: ({ text }) => {
                                sendProgress(runId, { progress: text })
                            },
                            partialCb: ({
                                responseChunk,
                                responseSoFar,
                                reasoningSoFar,
                                tokensSoFar,
                                responseTokens,
                                inner,
                            }) => {
                                sendProgress(runId, {
                                    response: responseSoFar,
                                    reasoning: reasoningSoFar,
                                    responseChunk,
                                    tokens: tokensSoFar,
                                    responseTokens,
                                    inner,
                                })
                            },
                        })
                            .then(({ exitCode, result }) => {
                                delete runs[runId]
                                logVerbose(
                                    `\nrun ${runId}: completed with ${exitCode}`
                                )
                                lastRunResult = {
                                    type: "script.end",
                                    runId,
                                    exitCode,
                                    result,
                                    trace: trace.content,
                                }
                                sendLastRunResult()
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
                        logVerbose(`run ${runId}: abort (${reason})`)
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

    const runRx = /^\/api\/runs\/(?<runId>[A-Za-z0-9_\-]{12,256})$/
    const imageRx =
        /^\/\.genaiscript\/(images|runs\/.*?)\/[a-z0-9]{12,128}\.(png|jpg|jpeg|gif|svg)$/

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

            const cspUrl = new URL(`http://${req.headers.host}`).origin
            const wsCspUrl = new URL(`ws://${req.headers.host}`).origin
            const nonce = randomHex(32)
            const csp = `<meta http-equiv="Content-Security-Policy" content="
    default-src 'none'; 
    frame-src ${cspUrl} https://*.github.dev/ https://github.dev/ https:; 
    img-src ${cspUrl} https://*.github.dev/ https://github.dev/ https: data:;
    media-src ${cspUrl} https://*.github.dev/ https://github.dev/ https: data:;
    connect-src ${cspUrl} ${wsCspUrl} https://*.github.dev/ wss://*.github.dev/ https://github.dev/;
    script-src ${cspUrl} https://*.github.dev/ https://github.dev/ 'nonce-${nonce}'; 
    style-src 'unsafe-inline' ${cspUrl} https://*.github.dev/ https://github.dev/;
    font-src ${cspUrl} https://*.github.dev/ https://github.dev/;
"/>
<script nonce=${nonce}>
window.litNonce = ${JSON.stringify(nonce)};
window.vscodeWebviewPlaygroundNonce = ${JSON.stringify(nonce)};
</script>
        `

            const filePath = join(__dirname, "index.html")
            const html = (
                await readFile(filePath, { encoding: "utf8" })
            ).replace("<!--csp-->", csp)
            res.write(html)
            res.statusCode = 200
            res.end()
        } else if (method === "GET" && route === "/built/markdown.css") {
            res.setHeader("Content-Type", "text/css")
            res.statusCode = 200
            const filePath = join(__dirname, "markdown.css")
            const stream = createReadStream(filePath)
            stream.pipe(res)
        } else if (method === "GET" && route === "/built/codicon.css") {
            res.setHeader("Content-Type", "text/css")
            res.statusCode = 200
            const filePath = join(__dirname, "codicon.css")
            const stream = createReadStream(filePath)
            stream.pipe(res)
        } else if (method === "GET" && route === "/built/codicon.ttf") {
            res.setHeader("Content-Type", "font/ttf")
            res.statusCode = 200
            const filePath = join(__dirname, "codicon.ttf")
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
        } else if (method === "GET" && imageRx.test(route)) {
            const filePath = join(process.cwd(), route)
            try {
                const stream = createReadStream(filePath)
                res.setHeader("Content-Type", "image/" + extname(route))
                res.statusCode = 200
                stream.pipe(res)
            } catch (e) {
                res.statusCode = 404
                res.end()
            }
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
            } else if (method === "GET" && route === "/api/runs") {
                const runs = await collectRuns()
                response = <RunResultListResponse>{
                    ok: true,
                    runs: runs.map(
                        ({ scriptId, runId, creationTme: creationTime }) => ({
                            scriptId,
                            runId,
                            creationTime,
                        })
                    ),
                }
            } else if (method === "POST" && route === "/v1/chat/completions") {
                await openaiApiChatCompletions(req, res)
                return
            } else if (method === "GET" && route === "/v1/models") {
                await openaiApiModels(req, res)
                return
            } else if (method === "GET" && runRx.test(route)) {
                const { runId } = runRx.exec(route).groups
                logVerbose(`run: get ${runId}`)
                // shortcut to last run
                if (runId === lastRunResult?.runId)
                    response = {
                        ok: true,
                        ...lastRunResult,
                    }
                else {
                    const runs = await collectRuns()
                    const run = runs.find((r) => r.runId === runId)
                    if (run) {
                        const runResult =
                            (await tryReadJSON(join(run.dir, "res.json"))) || {}
                        const runTrace =
                            (await tryReadText(
                                join(run.dir, TRACE_FILENAME)
                            )) || ""
                        response = (<PromptScriptEndResponseEvent>{
                            ok: true,
                            type: "script.end",
                            runId,
                            exitCode: runResult.exitCode,
                            result: runResult,
                            trace: runTrace,
                        }) as any
                    }
                }
            }

            if (response === undefined) {
                console.debug(`404: ${method} ${url}`)
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
    const serverHash = apiKey ? `#api-key:${encodeURIComponent(apiKey)}` : ""
    httpServer.listen(port, serverHost, () => {
        console.log(`GenAIScript server v${CORE_VERSION}`)
        if (remote)
            console.log(
                `│ Remote: ${remote}${options.remoteBranch ? `#${options.remoteBranch}` : ""}`
            )
        console.log(`│ Local http://${serverHost}:${port}/${serverHash}`)
        if (options.network) {
            console.log(`│ Host http://localhost:${port}/${serverHash}`)
            const interfaces = networkInterfaces()
            for (const ifaces of Object.values(interfaces)) {
                for (const iface of ifaces) {
                    if (iface.family === "IPv4" && !iface.internal) {
                        console.log(
                            `│ Network http://${iface.address}:${port}/${serverHash}`
                        )
                    }
                }
            }
        }
    })
}
