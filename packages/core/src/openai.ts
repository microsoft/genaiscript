import { ellipse, logError, logInfo, logVerbose } from "./util"
import { host } from "./host"
import {
    AZURE_AI_INFERENCE_VERSION,
    AZURE_OPENAI_API_VERSION,
    MODEL_PROVIDER_AZURE_OPENAI,
    MODEL_PROVIDER_AZURE_SERVERLESS_MODELS,
    MODEL_PROVIDER_AZURE_SERVERLESS_OPENAI,
    MODEL_PROVIDER_OPENAI_HOSTS,
    OPENROUTER_API_CHAT_URL,
    OPENROUTER_SITE_NAME_HEADER,
    OPENROUTER_SITE_URL_HEADER,
    THINK_END_TOKEN_REGEX,
    THINK_START_TOKEN_REGEX,
    TOOL_ID,
    TOOL_NAME,
    TOOL_URL,
} from "./constants"
import { approximateTokens } from "./tokens"
import {
    ChatCompletionHandler,
    CreateImageRequest,
    CreateImageResult,
    CreateSpeechRequest,
    CreateSpeechResult,
    CreateTranscriptionRequest,
    LanguageModel,
    ListModelsFunction,
} from "./chat"
import {
    RequestError,
    errorMessage,
    isCancelError,
    serializeError,
} from "./error"
import { createFetch } from "./fetch"
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
    EmbeddingCreateResponse,
    EmbeddingCreateParams,
    EmbeddingResult,
    ImageGenerationResponse,
} from "./chattypes"
import { resolveTokenEncoder } from "./encoders"
import { CancellationOptions, checkCancelled } from "./cancellation"
import { INITryParse } from "./ini"
import { serializeChunkChoiceToLogProbs } from "./logprob"
import { TraceOptions } from "./trace"
import { LanguageModelConfiguration } from "./server/messages"
import prettyBytes from "pretty-bytes"
import {
    deleteUndefinedValues,
    isEmptyString,
    normalizeInt,
    trimTrailingSlash,
} from "./cleaners"
import { fromBase64 } from "./base64"
import debug from "debug"
import { traceFetchPost } from "./fetchtext"
import { providerFeatures } from "./features"
import { genaiscriptDebug } from "./debug"
const dbg = genaiscriptDebug("openai")
const dbgMessages = dbg.extend("msg")
dbgMessages.enabled = false

/**
 * Generates configuration headers for API requests based on the provided configuration object.
 *
 * @param cfg - The configuration object containing details for API access.
 *   - token: Authentication token for the API.
 *   - type: The type of model (e.g., azure_serverless_models, openai, etc.).
 *   - base: Base URL of the API.
 *   - provider: Identifier for the model provider.
 * @returns A record of key-value pairs representing the headers, including:
 *   - Authorization: The formatted authorization header if applicable.
 *   - api-key: API key if Bearer authentication is not used.
 *   - User-Agent: A constant user agent identifier for the tool.
 */
export function getConfigHeaders(cfg: LanguageModelConfiguration) {
    let { token, type, base, provider } = cfg
    if (type === "azure_serverless_models") {
        const keys = INITryParse(token)
        if (keys && Object.keys(keys).length > 1) token = keys[cfg.model]
    }
    const features = providerFeatures(provider)
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
    const { provider, model, family, reasoningEffort } = parseModelIdentifier(
        req.model
    )
    const features = providerFeatures(provider)
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
        dbg(`removing stream_options`)
        delete postReq.stream_options
    }

    if (MODEL_PROVIDER_OPENAI_HOSTS.includes(provider)) {
        if (/^o\d|gpt-4\.1/.test(family)) {
            dbg(`changing max_tokens to max_completion_tokens`)
            if (postReq.max_tokens) {
                postReq.max_completion_tokens = postReq.max_tokens
                delete postReq.max_tokens
            }
        }

        if (/^o\d/.test(family)) {
            dbg(`removing options to support o1/o3/o4`)
            delete postReq.temperature
            delete postReq.top_p
            delete postReq.presence_penalty
            delete postReq.frequency_penalty
            delete postReq.logprobs
            delete postReq.top_logprobs
            delete postReq.logit_bias
            if (!postReq.reasoning_effort && reasoningEffort) {
                postReq.model = family
                postReq.reasoning_effort = reasoningEffort
            }
        }

        if (/^o1/.test(family)) {
            dbg(`removing options to support o1`)
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

    const singleModel = !!features?.singleModel
    if (singleModel) delete postReq.model

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
        trace?.itemValue(`version`, version)
        url =
            trimTrailingSlash(cfg.base) +
            "/" +
            family +
            `/chat/completions?api-version=${version}`
    } else if (cfg.type === "azure_ai_inference") {
        const version = cfg.version
        trace?.itemValue(`version`, version)
        url = trimTrailingSlash(cfg.base) + `/chat/completions`
        if (version) url += `?api-version=${version}`
        ;(headers as any)["extra-parameters"] = "pass-through"
    } else if (cfg.type === "azure_serverless_models") {
        const version = cfg.version || AZURE_AI_INFERENCE_VERSION
        trace?.itemValue(`version`, version)
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
        trace?.itemValue(`version`, version)
        url =
            trimTrailingSlash(cfg.base) +
            "/" +
            family +
            `/chat/completions?api-version=${version}`
        // https://learn.microsoft.com/en-us/azure/machine-learning/reference-model-inference-api?view=azureml-api-2&tabs=javascript#extensibility
        ;(headers as any)["extra-parameters"] = "pass-through"
        delete postReq.model
    } else if (cfg.type === "github") {
        url = cfg.base
        const { prefix } =
            /^(?<prefix>[^-]+)-([^\/]+)$/.exec(postReq.model)?.groups || {}
        const patch = {
            gpt: "openai",
            o: "openai",
            "text-embedding": "openai",
            phi: "microsoft",
            meta: "meta",
            llama: "meta",
            mistral: "mistral-ai",
            deepseek: "deepseek",
        }[prefix?.toLowerCase() || ""]
        if (patch) {
            postReq.model = `${patch}/${postReq.model}`
            dbg(`updated model to ${postReq.model}`)
        }
    } else if (cfg.type === "huggingface") {
        // https://github.com/huggingface/text-generation-inference/issues/2946
        delete postReq.model
        url =
            trimTrailingSlash(cfg.base).replace(/\/v1$/, "") +
            "/models/" +
            family +
            `/v1/chat/completions`
    } else throw new Error(`api type ${cfg.type} not supported`)

    trace?.itemValue(`url`, `[${url}](${url})`)
    dbg(`url: ${url}`)

    let numTokens = 0
    let numReasoningTokens = 0
    const fetchRetry = await createFetch({
        trace,
        retries: retry,
        retryDelay,
        maxDelay,
        cancellationToken,
    })
    trace?.dispatchChange()

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
        trace?.error(errorMessage(e), e)
        throw e
    }

    trace?.itemValue(`status`, `${r.status} ${r.statusText}`)
    dbg(`response: ${r.status} ${r.statusText}`)
    if (r.status !== 200) {
        let responseBody: string
        try {
            responseBody = await r.text()
        } catch (e) {}
        if (!responseBody) responseBody
        trace?.fence(responseBody, "json")
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

        if (!postReq.stream) trace?.detailsFenced(`📬 response`, obj, "json")
        dbgMessages(`%O`, obj)

        if (obj.usage) usage = obj.usage
        if (!responseModel && obj.model) {
            responseModel = obj.model
            dbg(`model: ${responseModel}`)
        }
        if (!obj.choices?.length) return
        else if (obj.choices?.length != 1)
            throw new Error("too many choices in response")
        const choice = obj.choices[0]
        const { finish_reason } = choice
        if (finish_reason) {
            dbg(`finish reason: ${finish_reason}`)
            finishReason = finish_reason as any
        }
        if ((choice as ChatCompletionChunkChoice).delta) {
            const { delta, logprobs } = choice as ChatCompletionChunkChoice
            if (logprobs?.content) lbs.push(...logprobs.content)
            if (typeof delta?.content === "string" && delta.content !== "") {
                let content = delta.content
                if (!reasoning && THINK_START_TOKEN_REGEX.test(content)) {
                    dbg(`entering <think>`)
                    reasoning = true
                    content = content.replace(THINK_START_TOKEN_REGEX, "")
                } else if (reasoning && THINK_END_TOKEN_REGEX.test(content)) {
                    dbg(`leaving <think>`)
                    reasoning = false
                    content = content.replace(THINK_END_TOKEN_REGEX, "")
                }

                if (!isEmptyString(content)) {
                    if (reasoning) {
                        numReasoningTokens += approximateTokens(content, {
                            encoder,
                        })
                        reasoningChatResp += content
                        reasoningTokens.push(
                            ...serializeChunkChoiceToLogProbs(
                                choice as ChatCompletionChunkChoice
                            )
                        )
                    } else {
                        numTokens += approximateTokens(content, { encoder })
                        chatResp += content
                        tokens.push(
                            ...serializeChunkChoiceToLogProbs(
                                choice as ChatCompletionChunkChoice
                            )
                        )
                    }
                    trace?.appendToken(content)
                }
            }
            if (
                typeof delta?.reasoning_content === "string" &&
                delta.reasoning_content !== ""
            ) {
                numTokens += approximateTokens(delta.reasoning_content, {
                    encoder,
                })
                reasoningChatResp += delta.reasoning_content
                reasoningTokens.push(
                    ...serializeChunkChoiceToLogProbs(
                        choice as ChatCompletionChunkChoice
                    )
                )
                trace?.appendToken(delta.reasoning_content)
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
            numTokens =
                usage?.total_tokens ?? approximateTokens(chatResp, { encoder })
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

    trace?.appendContent("\n\n")
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
                    trace?.error(`error processing chunk`, e)
                }
                return ""
            })
            // end replace
            const reasoningProgress = reasoningChatResp.slice(rch0.length)
            const chatProgress = chatResp.slice(ch0.length)
            if (
                !isEmptyString(chatProgress) ||
                !isEmptyString(reasoningProgress)
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

    trace?.appendContent("\n\n")
    if (responseModel) trace?.itemValue(`model`, responseModel)
    trace?.itemValue(`🏁 finish reason`, finishReason)
    if (usage?.total_tokens) {
        trace?.itemValue(
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
        let url = trimTrailingSlash(cfg.base) + "/models"
        if (cfg.provider === MODEL_PROVIDER_AZURE_OPENAI) {
            url =
                trimTrailingSlash(cfg.base).replace(/deployments$/, "") +
                "/models"
        }
        const res = await fetch(url, {
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

/**
 * Transcribes an audio file using the specified language model configuration.
 * Can also perform translation if requested.
 *
 * @param req - Contains the transcription or translation details including:
 *              - `file`: The audio file to be transcribed.
 *              - `model`: The model to be used for transcription or translation.
 *              - `translate`: Optional, specifies if the operation is a translation.
 *              - `temperature`: Optional, adjusts the creativity of the transcription (if supported).
 *              - `language`: Optional, specifies the language of the audio.
 * @param cfg - Language model configuration, includes:
 *              - `base`: The base API URL for the model.
 *              - `provider`: The identifier of the model provider.
 *              - `model`: The specific model to use for transcription.
 * @param options - Options affecting the behavior of the function, including:
 *                  - `trace`: Trace logging object for debugging and monitoring.
 *                  - `cancellationToken`: Optional, allows cancellation of the operation.
 * @returns A promise that resolves to a transcription result, including:
 *          - `text`: The transcribed text, or undefined if an error occurs.
 *          - `error`: Details of any error encountered.
 */
export async function OpenAITranscribe(
    req: CreateTranscriptionRequest,
    cfg: LanguageModelConfiguration,
    options: TraceOptions & CancellationOptions & RetryOptions
): Promise<TranscriptionResult> {
    const { trace } = options || {}
    try {
        logVerbose(
            `${cfg.provider}: transcribe ${req.file.type} ${prettyBytes(req.file.size)} with ${cfg.model}`
        )
        const route = req.translate ? "translations" : "transcriptions"
        const url = `${cfg.base}/audio/${route}`
        trace?.itemValue(`url`, `[${url}](${url})`)
        trace?.itemValue(`size`, req.file.size)
        trace?.itemValue(`mime`, req.file.type)
        const body = new FormData()
        body.append("model", req.model)
        body.append(
            "response_format",
            /whisper/.test(req.model) ? "verbose_json" : "json"
        )
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
        trace?.itemValue(`status`, `${res.status} ${res.statusText}`)
        const j = await res.json()
        if (!res.ok) return { text: undefined, error: j?.error }
        else return j
    } catch (e) {
        logError(e)
        trace?.error(e)
        return { text: undefined, error: serializeError(e) }
    }
}

/**
 * Generates speech audio from provided text input using the specified configuration and options.
 *
 * @param req - The request payload containing details for generating speech, including:
 *   - model: The model to use for generating speech.
 *   - input: The text input to convert to speech.
 *   - voice: The voice profile to use for speech synthesis (default is "alloy").
 *   - Additional optional parameters for speech customization.
 * @param cfg - The configuration for the language model, including:
 *   - base: Base URL of the API.
 *   - model: Model identifier.
 *   - provider: The provider of the model.
 * @param options - Supplementary options for the request, such as:
 *   - trace: Trace object for logging and debugging.
 *   - cancellationToken: Token to handle cancellation of the operation.
 * @returns A promise that resolves to an object containing:
 *   - audio: The generated speech audio as a Uint8Array, or undefined if an error occurred.
 *   - error: Information about any error that occurred, or undefined if successful.
 */
export async function OpenAISpeech(
    req: CreateSpeechRequest,
    cfg: LanguageModelConfiguration,
    options: TraceOptions & CancellationOptions & RetryOptions
): Promise<CreateSpeechResult> {
    const { model, input, voice = "alloy", ...rest } = req
    const { trace } = options || {}
    const fetch = await createFetch(options)
    try {
        logVerbose(`${cfg.provider}: speak with ${cfg.model}`)
        const url = `${cfg.base}/audio/speech`
        trace?.itemValue(`url`, `[${url}](${url})`)
        const body = {
            model,
            input,
            voice,
            ...rest,
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
        trace?.itemValue(`status`, `${res.status} ${res.statusText}`)
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

/**
 * Generates an image using the specified model and prompt.
 *
 * @param req - An object containing the image generation request, including:
 *              - model: The name of the model to use for image generation.
 *              - prompt: The text prompt to generate the image.
 *              - size: Optional; dimensions of the image in "widthxheight" format or keywords like "portrait", "landscape", "square", or "auto". Defaults to "1024x1024".
 *              - quality: Optional; image quality setting ("auto", "high", "hd").
 *              - style: Optional; style attributes for image generation.
 *              - Additional parameters required for the request.
 * @param cfg - The configuration for the language model, including:
 *              - base: Base URL of the API endpoint.
 *              - provider: The provider of the model (e.g., Azure, OpenAI).
 *              - type: The API type being used (e.g., azure, openai).
 *              - model: The model identifier, if required by the provider.
 *              - version: Optional; API version for Azure OpenAI.
 * @param options - Additional options including:
 *                  - trace: Optional; tracing information for debugging/logging.
 *                  - cancellationToken: Optional; token to handle request cancellation.
 * @returns - A result containing either the generated image as a Uint8Array, the revised prompt, usage information, or an error message.
 */
export async function OpenAIImageGeneration(
    req: CreateImageRequest,
    cfg: LanguageModelConfiguration,
    options: TraceOptions & CancellationOptions & RetryOptions
): Promise<CreateImageResult> {
    const {
        model,
        prompt,
        size = "1024x1024",
        quality,
        style,
        outputFormat,
        ...rest
    } = req
    const { trace } = options || {}
    let url = `${cfg.base}/images/generations`

    const isDallE = /^dall-e/i.test(model)
    const isDallE2 = /^dall-e-2/i.test(model)
    const isDallE3 = /^dall-e-3/i.test(model)
    const isGpt = /^gpt-image/i.test(model)

    const body: any = {
        model,
        prompt,
        size,
        quality,
        style,
        ...rest,
    }

    // auto is the default quality, so always delete it
    if (body.quality === "auto" || isDallE2) delete body.quality
    if (isDallE3) {
        if (body.quality === "high") body.quality = "hd"
        else delete body.quality
    }
    if (isGpt && body.quality === "hd") body.quality = "high"
    if (!isDallE3) delete body.style
    if (isDallE) body.response_format = "b64_json"

    if (isDallE3) {
        if (body.size === "portrait") body.size = "1024x1792"
        else if (body.size === "landscape") body.size = "1792x1024"
        else if (body.size === "square") body.size = "1024x1024"
    } else if (isDallE2) {
        if (
            body.size === "portrait" ||
            body.size === "landscape" ||
            body.size === "square"
        )
            body.size = "1024x1024"
    } else if (isGpt) {
        if (body.size === "portrait") body.size = "1024x1536"
        else if (body.size === "landscape") body.size = "1536x1024"
        else if (body.size === "square") body.size = "1024x1024"
        if (outputFormat) body.output_format = outputFormat
    }

    if (body.size === "auto") delete body.size

    dbg("%o", {
        quality: body.quality,
        style: body.style,
        response_format: body.response_format,
        size: body.size,
    })

    if (cfg.type === "azure") {
        const version = cfg.version || AZURE_OPENAI_API_VERSION
        trace?.itemValue(`version`, version)
        url =
            trimTrailingSlash(cfg.base) +
            "/" +
            body.model +
            `/images/generations?api-version=${version}`
        delete body.model
    }

    const fetch = await createFetch(options)
    try {
        logInfo(
            `generate image with ${cfg.provider}:${cfg.model} (this may take a while)`
        )
        const freq = {
            method: "POST",
            headers: {
                ...getConfigHeaders(cfg),
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        }
        // TODO: switch back to cross-fetch in the future
        trace?.itemValue(`url`, `[${url}](${url})`)
        traceFetchPost(trace, url, freq.headers, body)
        const res = await fetch(url, freq as any)
        dbg(`response: %d %s`, res.status, res.statusText)
        trace?.itemValue(`status`, `${res.status} ${res.statusText}`)
        if (!res.ok)
            return {
                image: undefined,
                error: (await res.json())?.error || res.statusText,
            }
        const j: ImageGenerationResponse = await res.json()
        dbg(`%O`, j)
        const revisedPrompt = j.data[0]?.revised_prompt
        if (revisedPrompt)
            trace?.details(`📷 revised prompt`, j.data[0].revised_prompt)
        const usage = j.usage
        const buffer = fromBase64(j.data[0].b64_json)
        return {
            image: new Uint8Array(buffer),
            revisedPrompt,
            usage,
        } satisfies CreateImageResult
    } catch (e) {
        logError(e)
        trace?.error(e)
        return {
            image: undefined,
            error: serializeError(e),
        } satisfies CreateImageResult
    }
}

/**
 * Executes an embedding request using the specified language model configuration.
 *
 * @param input - The text input to generate embeddings for.
 * @param cfg - Configuration for the language model, including base URL, provider, type, and model details.
 * @param options - Optional parameters including trace for debugging and cancellationToken for request cancellation.
 * @returns An EmbeddingResult object containing the embeddings or error details if the operation fails.
 *
 * This function determines the proper API route based on the model provider type. It constructs a POST request to retrieve embeddings
 * for the given input. Handles response parsing, error checking, and supports cancellation.
 */
export async function OpenAIEmbedder(
    input: string,
    cfg: LanguageModelConfiguration,
    options: TraceOptions & CancellationOptions & RetryOptions
): Promise<EmbeddingResult> {
    const { trace, cancellationToken } = options || {}
    const { base, provider, type, model } = cfg
    try {
        const route = "embeddings"
        let url: string
        const body: EmbeddingCreateParams = { input, model: cfg.model }

        // Determine the URL based on provider type
        if (
            provider === MODEL_PROVIDER_AZURE_OPENAI ||
            provider === MODEL_PROVIDER_AZURE_SERVERLESS_OPENAI ||
            type === "azure" ||
            type === "azure_serverless"
        ) {
            url = `${trimTrailingSlash(base)}/${model}/embeddings?api-version=${AZURE_OPENAI_API_VERSION}`
            delete body.model
        } else if (provider === MODEL_PROVIDER_AZURE_SERVERLESS_MODELS) {
            url = base.replace(/^https?:\/\/([^/]+)\/?/, body.model)
            delete body.model
        } else {
            url = `${base}/${route}`
        }

        trace?.itemValue(`url`, `[${url}](${url})`)

        const freq = {
            method: "POST",
            headers: {
                ...getConfigHeaders(cfg),
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify(body),
        }
        // traceFetchPost(trace, url, freq.headers, body)
        logVerbose(
            `${type}: embedding ${ellipse(input, 44)} with ${provider}:${model}`
        )
        const fetch = await createFetch(options)
        checkCancelled(cancellationToken)
        const res = await fetch(url, freq)
        trace?.itemValue(`response`, `${res.status} ${res.statusText}`)

        if (res.status === 429)
            return { error: "rate limited", status: "rate_limited" }
        else if (res.status < 300) {
            const data = (await res.json()) as EmbeddingCreateResponse
            return {
                status: "success",
                data: data.data
                    .sort((a, b) => a.index - b.index)
                    .map((d) => d.embedding),
                model: data.model,
            }
        } else {
            return { error: res.statusText, status: "error" }
        }
    } catch (e) {
        if (isCancelError(e)) return { status: "cancelled" }
        logError(e)
        trace?.error(e)
        return { status: "error", error: errorMessage(e) }
    }
}

/**
 * Creates a language model configuration compatible with OpenAI-like APIs.
 *
 * @param providerId - Identifier of the model provider.
 * @param options - Optional configuration object.
 * @param options.listModels - Enables listing of available models if true.
 * @param options.transcribe - Enables transcription capabilities if true.
 * @param options.speech - Enables speech synthesis capabilities if true.
 * @param options.imageGeneration - Enables image generation capabilities if true.
 *
 * @returns A frozen object defining the language model with specified capabilities.
 */
export function LocalOpenAICompatibleModel(
    providerId: string,
    options: {
        listModels?: boolean
        transcribe?: boolean
        speech?: boolean
        imageGeneration?: boolean
    }
) {
    return Object.freeze<LanguageModel>(
        deleteUndefinedValues({
            completer: OpenAIChatCompletion,
            id: providerId,
            listModels: options?.listModels ? OpenAIListModels : undefined,
            transcriber: options?.transcribe ? OpenAITranscribe : undefined,
            speaker: options?.speech ? OpenAISpeech : undefined,
            imageGenerator: options?.imageGeneration
                ? OpenAIImageGeneration
                : undefined,
            embedder: OpenAIEmbedder,
        })
    )
}
