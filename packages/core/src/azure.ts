import {
    ChatCompletionHandler,
    ChatCompletionRequestCacheKey,
    ChatCompletionResponse,
    ChatCompletionToolCall,
    getChatCompletionCache,
    LanguageModel,
} from "./chat"
import {
    MAX_CACHED_TEMPERATURE,
    MAX_CACHED_TOP_P,
    MODEL_PROVIDER_AZURE,
} from "./constants"
import { parseModelIdentifier } from "./models"
import { estimateTokens } from "./tokens"
import {
    ChatChoice,
    ChatCompletionsFunctionToolCall,
    OpenAIClient,
} from "@azure/openai"
import { DefaultAzureCredential } from "@azure/identity"

/**
 * Azure specific support with managed identity
 */
export function createAzureOpenAIModel() {
    const completer: ChatCompletionHandler = async (
        req,
        cfg,
        options,
        trace
    ) => {
        const {
            temperature,
            top_p,
            seed,
            tools,
            messages,
            max_tokens,
            response_format,
        } = req
        const {
            requestOptions,
            partialCb,
            maxCachedTemperature = MAX_CACHED_TEMPERATURE,
            maxCachedTopP = MAX_CACHED_TOP_P,
            cache: useCache,
            cacheName,
        } = options
        const { signal } = requestOptions || {}
        const { token, source, ...cfgNoToken } = cfg
        const { model } = parseModelIdentifier(req.model)

        const cache = getChatCompletionCache(cacheName)
        const caching =
            useCache === true || // always use cache
            (useCache !== false && // never use cache
                seed === undefined && // seed is not cacheable (let the LLM make the run deterministic)
                !tools?.length && // assume tools are non-deterministic by default
                (isNaN(temperature) ||
                    isNaN(maxCachedTemperature) ||
                    temperature < maxCachedTemperature) && // high temperature is not cacheable (it's too random)
                (isNaN(top_p) || isNaN(maxCachedTopP) || top_p < maxCachedTopP))
        trace.itemValue(`caching`, caching)
        const cachedKey = caching
            ? <ChatCompletionRequestCacheKey>{
                  ...req,
                  ...cfgNoToken,
                  model: req.model,
                  temperature: req.temperature,
                  top_p: req.top_p,
                  max_tokens: req.max_tokens,
              }
            : undefined
        const { text: cached, finishReason: cachedFinishReason } =
            (cachedKey ? await cache.get(cachedKey) : undefined) || {}
        if (cached !== undefined) {
            partialCb?.({
                tokensSoFar: estimateTokens(model, cached),
                responseSoFar: cached,
                responseChunk: cached,
            })
            trace.itemValue(`cache hit`, await cache.getKeySHA(cachedKey))
            return {
                text: cached,
                finishReason: cachedFinishReason,
                cached: true,
            }
        }

        trace.itemValue(`endpoint`, `[${cfg.base}](${cfg.base})`)

        const toolCalls: ChatCompletionToolCall[] = []

        let chatResp = ""
        let numTokens = 0
        let finishReason: ChatChoice["finishReason"] = undefined

        try {
            const credentials = new DefaultAzureCredential()
            const client = new OpenAIClient(cfg.base, credentials)
            const events = await client.streamChatCompletions(model, messages, {
                temperature,
                topP: top_p,
                maxTokens: max_tokens,
                abortSignal: signal,
                seed,
                responseFormat: response_format as any,
                tools,
            })
            trace.dispatchChange()

            for await (const event of events) {
                for (const choice of event.choices) {
                    const { finishReason: finish_reason, delta } = choice
                    if (finish_reason) finishReason = finish_reason
                    if (typeof delta?.content == "string") {
                        if (delta.content) {
                            numTokens += estimateTokens(model, delta.content)
                            chatResp += delta.content
                            chatResp += delta.content
                            trace.content += delta.content.includes("`")
                                ? `\`\`\` ${delta.content.replace(/\n/g, " ")} \`\`\` `
                                : `\`${delta.content.replace(/\n/g, " ")}\` `
                            partialCb?.({
                                responseSoFar: chatResp,
                                tokensSoFar: numTokens,
                                responseChunk: delta.content,
                            })
                        }
                    } else if (Array.isArray(delta.toolCalls)) {
                        for (const call of delta.toolCalls as ChatCompletionsFunctionToolCall[]) {
                            const tc = <ChatCompletionToolCall>{
                                id: call.id,
                                name: call.function.name,
                                arguments: "",
                            }
                            if (call.function.arguments)
                                tc.arguments += call.function.arguments
                            toolCalls[call.index ?? 0] = tc
                        }
                    }
                    if (
                        finish_reason === "function_call" ||
                        finish_reason === "tool_calls"
                    ) {
                        finishReason = "tool_calls"
                    } else {
                        finishReason = finish_reason
                    }
                }
            }
        } catch (e) {
            trace.error("Azure OpenAI request failed", e)
            throw e
        }

        trace.content += "\n\n"
        trace.itemValue(`finish reason`, finishReason)
        if (finishReason === "stop")
            await cache.set(
                cachedKey,
                { text: chatResp, finishReason },
                { trace }
            )

        return <ChatCompletionResponse>{
            text: chatResp,
            toolCalls,
            finishReason,
        }
    }

    return Object.freeze<LanguageModel>({
        completer,
        id: MODEL_PROVIDER_AZURE,
    })
}
