import { JSONLineCache } from "./cache"
import {
    ChatCompletionResponse,
    CreateChatCompletionRequest,
} from "./chattypes"
import { CHAT_CACHE } from "./constants"
import { LanguageModelConfiguration } from "./host"

export type ChatCompletionRequestCacheKey = CreateChatCompletionRequest &
    ModelOptions &
    Omit<LanguageModelConfiguration, "token" | "source">

export type ChatCompletationRequestCacheValue = {
    text: string
    finishReason: ChatCompletionResponse["finishReason"]
}

export type ChatCompletationRequestCache = JSONLineCache<
    ChatCompletionRequestCacheKey,
    ChatCompletationRequestCacheValue
>

export function getChatCompletionCache(): ChatCompletationRequestCache {
    return JSONLineCache.byName<
        ChatCompletionRequestCacheKey,
        ChatCompletationRequestCacheValue
    >(CHAT_CACHE)
}
