import type { ChatCompletionsProgressReport } from "../chattypes"
import { CLOSE, MESSAGE } from "../constants"
import { randomHex } from "../crypto"
import { errorMessage } from "../error"
import { MarkdownTrace } from "../trace"
import { logError } from "../util"
import type {
    PromptScriptTestRun,
    PromptScriptTestRunOptions,
    PromptScriptTestRunResponse,
    PromptScriptRunOptions,
    PromptScriptStart,
    PromptScriptResponseEvents,
    ChatEvents,
    ChatChunk,
    ChatStart,
    GenerationResult,
} from "./messages"
import { WebSocketClient } from "./wsclient"

export type LanguageModelChatRequest = (
    request: ChatStart,
    onChunk: (param: Omit<ChatChunk, "id" | "type" | "chatId">) => void
) => Promise<void>

export class VsCodeClient extends WebSocketClient {
    chatRequest: LanguageModelChatRequest

    private runs: Record<
        string,
        {
            script: string
            files: string[]
            options: Partial<PromptScriptRunOptions>
            trace: MarkdownTrace
            infoCb: (partialResponse: { text: string }) => void
            partialCb: (progress: ChatCompletionsProgressReport) => void
            promise: Promise<Partial<GenerationResult>>
            resolve: (value: Partial<GenerationResult>) => void
            reject: (reason?: any) => void
            signal: AbortSignal
        }
    > = {}

    constructor(
        readonly url: string,
        readonly externalUrl: string,
        readonly cspUrl: string
    ) {
        super(url)
        this.configure()
    }

    private installPolyfill() {
        if (typeof WebSocket === "undefined") {
            try {
                require("websocket-polyfill")
            } catch (err) {
                logError("websocket polyfill failed")
                logError(err)
            }
        }
    }

    private configure(): void {
        this.installPolyfill()
        this.addEventListener(CLOSE, (e) => {
            const reason = (e as any).reason || "websocket closed"
            for (const [runId, run] of Object.entries(this.runs)) {
                run.reject(reason)
                delete this.runs[runId]
            }
        })

        this.addEventListener(MESSAGE, async (e) => {
            const event = e as MessageEvent<
                PromptScriptResponseEvents | ChatEvents
            >
            // handle run progress
            const ev = event.data as PromptScriptResponseEvents
            const { runId, type } = ev
            const run = this.runs[runId]
            if (run) {
                switch (type) {
                    case "script.progress": {
                        if (ev.trace) run.trace.appendContent(ev.trace)
                        if (ev.progress) run.infoCb({ text: ev.progress })
                        if (ev.response || ev.tokens !== undefined)
                            run.partialCb({
                                responseChunk: ev.responseChunk,
                                responseSoFar: ev.response,
                                reasoningSoFar: ev.reasoning,
                                tokensSoFar: ev.tokens,
                                inner: ev.inner,
                            })
                        break
                    }
                    case "script.end": {
                        const run = this.runs[runId]
                        delete this.runs[runId]
                        if (run) {
                            const res = structuredClone(ev.result)
                            if (res?.text) run.infoCb(res as { text: string })
                            run.resolve(res)
                        }
                        break
                    }
                }
            } else {
                const cev = event.data as ChatEvents
                const { chatId, type } = cev
                switch (type) {
                    case "chat.start": {
                        if (!this.chatRequest)
                            throw new Error(
                                "GitHub Copilot Chat Models not supported"
                            )
                        await this.chatRequest(cev, (chunk) => {
                            this.queue<ChatChunk>({
                                ...chunk,
                                chatId,
                                type: "chat.chunk",
                            })
                        })
                        // done
                    }
                }
            }
        })
    }

    async runScript(
        script: string,
        files: string[],
        options: Partial<PromptScriptRunOptions> & {
            jsSource?: string
            signal: AbortSignal
            trace: MarkdownTrace
            infoCb: (partialResponse: { text: string }) => void
            partialCb: (progress: ChatCompletionsProgressReport) => void
        }
    ) {
        const runId = randomHex(6)
        const { signal, infoCb, partialCb, trace, ...optionsRest } = options
        let resolve: (value: Partial<GenerationResult>) => void
        let reject: (reason?: any) => void
        const promise = new Promise<Partial<GenerationResult>>((res, rej) => {
            resolve = res
            reject = rej
        })
        this.runs[runId] = {
            script,
            files,
            options,
            trace,
            infoCb,
            partialCb,
            promise,
            resolve,
            reject,
            signal,
        }
        signal?.addEventListener("abort", () => {
            this.abortScript(runId)
        })
        const res = await this.queue<PromptScriptStart>({
            type: "script.start",
            runId,
            script,
            files,
            options: optionsRest,
        })
        if (!res.response?.ok) {
            delete this.runs[runId] // failed to start
            throw new Error(
                errorMessage(res.response?.error) ?? "failed to start script"
            )
        }
        return { runId, request: promise }
    }

    abortScriptRuns(reason?: string) {
        for (const runId of Object.keys(this.runs)) {
            this.abortScript(runId, reason)
            delete this.runs[runId]
        }
    }

    async runTest(
        script: PromptScript,
        options?: PromptScriptTestRunOptions
    ): Promise<PromptScriptTestRunResponse> {
        const res = await this.queue<PromptScriptTestRun>({
            type: "tests.run",
            scripts: script?.id ? [script?.id] : undefined,
            options,
        })
        return res.response
    }
}
