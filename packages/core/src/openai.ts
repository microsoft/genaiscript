import { logError, logVerbose } from "./util"
import { host } from "./host"
import {
    AZURE_AI_INFERENCE_VERSION,
    AZURE_OPENAI_API_VERSION,
    MODEL_PROVIDER_OPENAI_HOSTS,
    MODEL_PROVIDERS,
    OPENROUTER_API_CHAT_URL,
    OPENROUTER_SITE_NAME_HEADER,
    OPENROUTER_SITE_URL_HEADER,
    THINK_END_TOKEN_REGEX,
    THINK_START_TOKEN_REGEX,
    TOOL_ID,
    TOOL_NAME,
    TOOL_URL,
} from "./constants"
import { estimateTokens } from "./tokens"
import {
    ChatCompletionHandler,
    CreateSpeechRequest,
    CreateSpeechResult,
    CreateTranscriptionRequest,
    LanguageModel,
    ListModelsFunction,
} from "./chat"
import { RequestError, errorMessage, serializeError } from "./error"
import { createFetch, traceFetchPost } from "./fetch"
import { parseModelIdentifier } from "./models"
import { JSON5TryParse } from "./json5"
import {
    ChatCompletionToolCall,
    ChatCompletionResponse,
    ChatCompletionChunk,
    ChatCompletionUsage,
    ChatCompletion,
    ChatCompletionChunkChoice,
    ChatCompletionChoice,
    CreateChatCompletionRequest,
    ChatCompletionTokenLogprob,
    ChatCompletionReasoningEffort,
} from "./chattypes"
import { resolveTokenEncoder } from "./encoders"
import { CancellationOptions } from "./cancellation"
import { INITryParse } from "./ini"
import { serializeChunkChoiceToLogProbs } from "./logprob"
import { TraceOptions } from "./trace"
import {
    LanguageModelConfiguration,
    LanguageModelInfo,
} from "./server/messages"
import prettyBytes from "pretty-bytes"
import {
    deleteUndefinedValues,
    isNonEmptyString,
    normalizeInt,
    trimTrailingSlash,
} from "./cleaners"

export function getConfigHeaders(cfg: LanguageModelConfiguration) {
    let { token, type, base, provider } = cfg
    if (type === "azure_serverless_models") {
        const keys = INITryParse(token)
        if (keys && Object.keys(keys).length > 1) token = keys[cfg.model]
    }
    const features = MODEL_PROVIDERS.find(({ id }) => id === provider)
    const useBearer = features?.bearerToken !== false
    const isBearer = /^Bearer /i.test(cfg.token)
    const Authorization = isBearer
        ? token
        : token && (useBearer || base === OPENROUTER_API_CHAT_URL)
          ? `Bearer ${token}`
          : undefined
    const apiKey = Authorization ? undefined : token
    const res: Record<string, string> = deleteUndefinedValues({
        Authorization,
        "api-key": apiKey,
        "User-Agent": TOOL_ID,
    })
    return res
}

export const OpenAIChatCompletion: ChatCompletionHandler = async (
    req,
    cfg,
    options,
    trace
) => {
    const {
        requestOptions,
        partialCb,
        retry,
        retryDelay,
        maxDelay,
        cancellationToken,
        inner,
    } = options
    const { headers = {}, ...rest } = requestOptions || {}
    const { provider, model, family, tag } = parseModelIdentifier(req.model)
    const { encode: encoder } = await resolveTokenEncoder(family)

    const postReq = structuredClone({
        ...req,
        stream: true,
        stream_options: { include_usage: true },
        model,
        messages: req.messages.map(({ cacheControl, ...rest }) => ({
            ...rest,
        })),
    } satisfies CreateChatCompletionRequest)

    // stream_options fails in some cases
    if (family === "gpt-4-turbo-v" || /mistral/i.test(family)) {
        delete postReq.stream_options
    }

    if (MODEL_PROVIDER_OPENAI_HOSTS.includes(provider)) {
        if (/^o(1|3)/.test(family)) {
            delete postReq.temperature
            delete postReq.top_p
            delete postReq.presence_penalty
            delete postReq.frequency_penalty
            delete postReq.logprobs
            delete postReq.top_logprobs
            delete postReq.logit_bias
            if (postReq.max_tokens) {
                postReq.max_completion_tokens = postReq.max_tokens
                delete postReq.max_tokens
            }
            if (
                !postReq.reasoning_effort &&
                ["high", "medium", "low"].includes(tag)
            ) {
                postReq.model = family
                postReq.reasoning_effort = tag as ChatCompletionReasoningEffort
            }
        }

        if (/^o1/.test(family)) {
            const preview = /^o1-(preview|mini)/i.test(family)
            delete postReq.stream
            delete postReq.stream_options
            for (const msg of postReq.messages) {
                if (msg.role === "system") {
                    ;(msg as any).role = preview ? "user" : "developer"
                }
            }
        } else if (/^o3/i.test(family)) {
            for (const msg of postReq.messages) {
                if (msg.role === "system") {
                    ;(msg as any).role = "developer"
                }
            }
        }
    }

    let url = ""
    const toolCalls: ChatCompletionToolCall[] = []

    if (
        cfg.type === "openai" ||
        cfg.type === "localai" ||
        cfg.type === "alibaba"
    ) {
        url = trimTrailingSlash(cfg.base) + "/chat/completions"
        if (url === OPENROUTER_API_CHAT_URL) {
            ;(headers as any)[OPENROUTER_SITE_URL_HEADER] =
                process.env.OPENROUTER_SITE_URL || TOOL_URL
            ;(headers as any)[OPENROUTER_SITE_NAME_HEADER] =
                process.env.OPENROUTER_SITE_NAME || TOOL_NAME
        }
    } else if (cfg.type === "azure") {
        delete postReq.model
        const version = cfg.version || AZURE_OPENAI_API_VERSION
        trace.itemValue(`version`, version)
        url =
            trimTrailingSlash(cfg.base) +
            "/" +
            family.replace(/\./g, "") +
            `/chat/completions?api-version=${version}`
    } else if (cfg.type === "azure_ai_inference") {
        const version = cfg.version
        trace.itemValue(`version`, version)
        url = trimTrailingSlash(cfg.base) + `/chat/completions`
        if (version) url += `?api-version=${version}`
        ;(headers as any)["extra-parameters"] = "pass-through"
    } else if (cfg.type === "azure_serverless_models") {
        const version = cfg.version || AZURE_AI_INFERENCE_VERSION
        trace.itemValue(`version`, version)
        url =
            trimTrailingSlash(cfg.base).replace(
                /^https?:\/\/(?<deployment>[^\.]+)\.(?<region>[^\.]+)\.models\.ai\.azure\.com/i,
                (m, deployment, region) =>
                    `https://${postReq.model}.${region}.models.ai.azure.com`
            ) + `/chat/completions?api-version=${version}`
        ;(headers as any)["extra-parameters"] = "pass-through"
        delete postReq.model
        delete postReq.stream_options
    } else if (cfg.type === "azure_serverless") {
        const version = cfg.version || AZURE_AI_INFERENCE_VERSION
        trace.itemValue(`version`, version)
        url =
            trimTrailingSlash(cfg.base) +
            "/" +
            family.replace(/\./g, "") +
            `/chat/completions?api-version=${version}`
        // https://learn.microsoft.com/en-us/azure/machine-learning/reference-model-inference-api?view=azureml-api-2&tabs=javascript#extensibility
        ;(headers as any)["extra-parameters"] = "pass-through"
        delete postReq.model
    } else if (cfg.type === "huggingface") {
        // https://github.com/huggingface/text-generation-inference/issues/2946
        delete postReq.model
        url =
            trimTrailingSlash(cfg.base).replace(/\/v1$/, "") +
            "/models/" +
            family +
            `/v1/chat/completions`
    } else throw new Error(`api type ${cfg.type} not supported`)

    trace.itemValue(`url`, `[${url}](${url})`)

    let numTokens = 0
    let numReasoningTokens = 0
    const fetchRetry = await createFetch({
        trace,
        retries: retry,
        retryDelay,
        maxDelay,
        cancellationToken,
    })
    trace.dispatchChange()

    const fetchHeaders: HeadersInit = {
        "Content-Type": "application/json",
        ...getConfigHeaders(cfg),
        ...(headers || {}),
    }
    traceFetchPost(trace, url, fetchHeaders as any, postReq)
    const body = JSON.stringify(postReq)
    let r: Response
    try {
        r = await fetchRetry(url, {
            headers: fetchHeaders,
            body,
            method: "POST",
            ...(rest || {}),
        })
    } catch (e) {
        trace.error(errorMessage(e), e)
        throw e
    }

    trace.itemValue(`status`, `${r.status} ${r.statusText}`)
    if (r.status !== 200) {
        let responseBody: string
        try {
            responseBody = await r.text()
        } catch (e) {}
        if (!responseBody) responseBody
        trace.fence(responseBody, "json")
        const errors = JSON5TryParse(responseBody, {}) as
            | {
                  error: any
                  message: string
              }
            | { error: { message: string } }[]
            | { error: { message: string } }
        const error = Array.isArray(errors) ? errors[0]?.error : errors
        throw new RequestError(
            r.status,
            errorMessage(error) || r.statusText,
            errors,
            responseBody,
            normalizeInt(r.headers.get("retry-after"))
        )
    }

    let done = false
    let finishReason: ChatCompletionResponse["finishReason"] = undefined
    let chatResp = ""
    let reasoningChatResp = ""
    let pref = ""
    let usage: ChatCompletionUsage
    let error: SerializedError
    let responseModel: string
    let lbs: ChatCompletionTokenLogprob[] = []

    let reasoning = false

    const doChoices = (
        json: string,
        tokens: Logprob[],
        reasoningTokens: Logprob[]
    ) => {
        const obj: ChatCompletionChunk | ChatCompletion = JSON.parse(json)

        if (!postReq.stream) trace.detailsFenced(`📬 response`, obj, "json")

        if (obj.usage) usage = obj.usage
        if (!responseModel && obj.model) responseModel = obj.model
        if (!obj.choices?.length) return
        else if (obj.choices?.length != 1)
            throw new Error("too many choices in response")
        const choice = obj.choices[0]
        const { finish_reason } = choice
        if (finish_reason) finishReason = finish_reason as any
        if ((choice as ChatCompletionChunkChoice).delta) {
            const { delta, logprobs } = choice as ChatCompletionChunkChoice
            if (logprobs?.content) lbs.push(...logprobs.content)
            if (typeof delta?.content === "string" && delta.content !== "") {
                let content = delta.content
                if (!reasoning && THINK_START_TOKEN_REGEX.test(content)) {
                    reasoning = true
                    content = content.replace(THINK_START_TOKEN_REGEX, "")
                } else if (reasoning && THINK_END_TOKEN_REGEX.test(content)) {
                    reasoning = false
                    content = content.replace(THINK_END_TOKEN_REGEX, "")
                }

                if (isNonEmptyString(content)) {
                    if (reasoning) {
                        numReasoningTokens += estimateTokens(content, encoder)
                        reasoningChatResp += content
                        reasoningTokens.push(
                            ...serializeChunkChoiceToLogProbs(
                                choice as ChatCompletionChunkChoice
                            )
                        )
                    } else {
                        numTokens += estimateTokens(content, encoder)
                        chatResp += content
                        tokens.push(
                            ...serializeChunkChoiceToLogProbs(
                                choice as ChatCompletionChunkChoice
                            )
                        )
                    }
                    trace.appendToken(content)
                }
            }
            if (
                typeof delta?.reasoning_content === "string" &&
                delta.reasoning_content !== ""
            ) {
                numTokens += estimateTokens(delta.reasoning_content, encoder)
                reasoningChatResp += delta.reasoning_content
                reasoningTokens.push(
                    ...serializeChunkChoiceToLogProbs(
                        choice as ChatCompletionChunkChoice
                    )
                )
                trace.appendToken(delta.reasoning_content)
            }
            if (Array.isArray(delta?.tool_calls)) {
                const { tool_calls } = delta
                for (const call of tool_calls) {
                    const index = call.index ?? toolCalls.length
                    const tc =
                        toolCalls[index] ||
                        (toolCalls[index] = {
                            id: call.id,
                            name: call.function.name,
                            arguments: "",
                        })
                    if (call.function.arguments)
                        tc.arguments += call.function.arguments
                }
            }
        } else if ((choice as ChatCompletionChoice).message) {
            const { message } = choice as ChatCompletionChoice
            chatResp = message.content
            reasoningChatResp = message.reasoning_content
            numTokens = usage?.total_tokens ?? estimateTokens(chatResp, encoder)
            if (Array.isArray(message?.tool_calls)) {
                const { tool_calls } = message
                for (let calli = 0; calli < tool_calls.length; calli++) {
                    const call = tool_calls[calli]
                    const tc =
                        toolCalls[calli] ||
                        (toolCalls[calli] = {
                            id: call.id,
                            name: call.function.name,
                            arguments: "",
                        })
                    if (call.function.arguments)
                        tc.arguments += call.function.arguments
                }
            }
            partialCb?.(
                deleteUndefinedValues({
                    responseSoFar: chatResp,
                    reasoningSoFar: reasoningChatResp,
                    tokensSoFar: numTokens,
                    responseChunk: chatResp,
                    reasoningChunk: reasoningChatResp,
                    inner,
                })
            )
        }

        if (finish_reason === "function_call" || toolCalls.length > 0) {
            finishReason = "tool_calls"
        } else {
            finishReason = finish_reason
        }
    }

    trace.appendContent("\n\n")
    if (!postReq.stream) {
        const responseBody = await r.text()
        doChoices(responseBody, [], [])
    } else {
        const decoder = host.createUTF8Decoder()
        const doChunk = (value: Uint8Array) => {
            // Massage and parse the chunk of data
            const tokens: Logprob[] = []
            const reasoningTokens: Logprob[] = []
            let chunk = decoder.decode(value, { stream: true })

            chunk = pref + chunk
            const ch0 = chatResp
            const rch0 = reasoningChatResp
            chunk = chunk.replace(/^data:\s*(.*)[\r\n]+/gm, (_, json) => {
                if (json === "[DONE]") {
                    done = true
                    return ""
                }
                try {
                    doChoices(json, tokens, reasoningTokens)
                } catch (e) {
                    trace.error(`error processing chunk`, e)
                }
                return ""
            })
            // end replace
            const reasoningProgress = reasoningChatResp.slice(rch0.length)
            const chatProgress = chatResp.slice(ch0.length)
            if (
                !isNonEmptyString(chatProgress) ||
                !isNonEmptyString(reasoningProgress)
            ) {
                // logVerbose(`... ${progress.length} chars`);
                partialCb?.(
                    deleteUndefinedValues({
                        responseSoFar: chatResp,
                        reasoningSoFar: reasoningChatResp,
                        reasoningChunk: reasoningProgress,
                        tokensSoFar: numTokens,
                        responseChunk: chatProgress,
                        responseTokens: tokens,
                        reasoningTokens,
                        inner,
                    })
                )
            }
            pref = chunk
        }

        try {
            if (r.body.getReader) {
                const reader = r.body.getReader()
                while (!cancellationToken?.isCancellationRequested && !done) {
                    const { done: readerDone, value } = await reader.read()
                    if (readerDone) break
                    doChunk(value)
                }
            } else {
                for await (const value of r.body as any) {
                    if (cancellationToken?.isCancellationRequested || done)
                        break
                    doChunk(value)
                }
            }
            if (cancellationToken?.isCancellationRequested)
                finishReason = "cancel"
            else if (toolCalls?.length) finishReason = "tool_calls"
            finishReason = finishReason || "stop" // some provider do not implement this final mesage
        } catch (e) {
            finishReason = "fail"
            error = serializeError(e)
        }
    }

    trace.appendContent("\n\n")
    if (responseModel) trace.itemValue(`model`, responseModel)
    trace.itemValue(`🏁 finish reason`, finishReason)
    if (usage?.total_tokens) {
        trace.itemValue(
            `🪙 tokens`,
            `${usage.total_tokens} total, ${usage.prompt_tokens} prompt, ${usage.completion_tokens} completion`
        )
    }

    return deleteUndefinedValues({
        text: chatResp,
        reasoning: reasoningChatResp,
        toolCalls,
        finishReason,
        usage,
        error,
        model: responseModel,
        logprobs: lbs,
    }) satisfies ChatCompletionResponse
}

export const OpenAIListModels: ListModelsFunction = async (cfg, options) => {
    try {
        const fetch = await createFetch({ retries: 0, ...(options || {}) })
        const res = await fetch(cfg.base + "/models", {
            method: "GET",
            headers: {
                ...getConfigHeaders(cfg),
                Accept: "application/json",
            },
        })
        if (res.status !== 200)
            return {
                ok: false,
                status: res.status,
                error: serializeError(await res.json()),
            }
        const { data } = (await res.json()) as {
            object: "list"
            data: {
                id: string
                object: "model"
                created: number
                owned_by: string
            }[]
        }
        return {
            ok: true,
            models: data.map(
                (m) =>
                    ({
                        id: m.id,
                        details: `${m.id}, ${m.owned_by}`,
                    }) satisfies LanguageModelInfo
            ),
        }
    } catch (e) {
        return { ok: false, error: serializeError(e) }
    }
}

export async function OpenAITranscribe(
    req: CreateTranscriptionRequest,
    cfg: LanguageModelConfiguration,
    options: TraceOptions & CancellationOptions
): Promise<TranscriptionResult> {
    const { trace } = options || {}
    try {
        logVerbose(
            `${cfg.provider}: transcribe ${req.file.type} ${prettyBytes(req.file.size)} with ${cfg.model}`
        )
        const route = req.translate ? "translations" : "transcriptions"
        const url = `${cfg.base}/audio/${route}`
        trace.itemValue(`url`, `[${url}](${url})`)
        trace.itemValue(`size`, req.file.size)
        trace.itemValue(`mime`, req.file.type)
        const body = new FormData()
        body.append("model", req.model)
        body.append("response_format", "verbose_json")
        if (req.temperature)
            body.append("temperature", req.temperature.toString())
        if (req.language) body.append("language", req.language)
        body.append("file", req.file)

        const freq = {
            method: "POST",
            headers: {
                ...getConfigHeaders(cfg),
                Accept: "application/json",
            },
            body: body,
        }
        traceFetchPost(trace, url, freq.headers, freq.body)
        // TODO: switch back to cross-fetch in the future
        const res = await global.fetch(url, freq as any)
        trace.itemValue(`status`, `${res.status} ${res.statusText}`)
        const j = await res.json()
        if (!res.ok) return { text: undefined, error: j?.error }
        else return j
    } catch (e) {
        logError(e)
        trace?.error(e)
        return { text: undefined, error: serializeError(e) }
    }
}

export async function OpenAISpeech(
    req: CreateSpeechRequest,
    cfg: LanguageModelConfiguration,
    options: TraceOptions & CancellationOptions
): Promise<CreateSpeechResult> {
    const { model, input, voice = "alloy", ...rest } = req
    const { trace } = options || {}
    const fetch = await createFetch(options)
    try {
        logVerbose(`${cfg.provider}: speak with ${cfg.model}`)
        const url = `${cfg.base}/audio/speech`
        trace.itemValue(`url`, `[${url}](${url})`)
        const body = {
            model,
            input,
            voice,
        }
        const freq = {
            method: "POST",
            headers: {
                ...getConfigHeaders(cfg),
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        }
        traceFetchPost(trace, url, freq.headers, body)
        // TODO: switch back to cross-fetch in the future
        const res = await fetch(url, freq as any)
        trace.itemValue(`status`, `${res.status} ${res.statusText}`)
        if (!res.ok)
            return { audio: undefined, error: (await res.json())?.error }
        const j = await res.arrayBuffer()
        return { audio: new Uint8Array(j) } satisfies CreateSpeechResult
    } catch (e) {
        logError(e)
        trace?.error(e)
        return {
            audio: undefined,
            error: serializeError(e),
        } satisfies CreateSpeechResult
    }
}

export function LocalOpenAICompatibleModel(
    providerId: string,
    options: { listModels?: boolean; transcribe?: boolean; speech?: boolean }
) {
    return Object.freeze<LanguageModel>(
        deleteUndefinedValues({
            completer: OpenAIChatCompletion,
            id: providerId,
            listModels: options?.listModels ? OpenAIListModels : undefined,
            transcriber: options?.transcribe ? OpenAITranscribe : undefined,
            speaker: options?.speech ? OpenAISpeech : undefined,
        })
    )
}
