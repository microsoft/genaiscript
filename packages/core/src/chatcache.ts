import { JSONLineCache } from "./cache"
import {
    ChatCompletionResponse,
    CreateChatCompletionRequest,
} from "./chattypes"
import { CHAT_CACHE } from "./constants"
import { LanguageModelConfiguration } from "./host"

// Define the type for a cache key, which combines chat completion request
// with additional model options, excluding "token" and "source" from the language model configuration.
export type ChatCompletionRequestCacheKey = CreateChatCompletionRequest &
    ModelOptions &
    Omit<LanguageModelConfiguration, "token" | "source">

// Define the type for a cache value, containing the response text
// and the reason for completion.
export type ChatCompletationRequestCacheValue = {
    text: string
    finishReason: ChatCompletionResponse["finishReason"]
}

// Define a JSON line cache type that maps cache keys to cache values.
export type ChatCompletationRequestCache = JSONLineCache<
    ChatCompletionRequestCacheKey,
    ChatCompletationRequestCacheValue
>

// Function to retrieve a chat completion cache.
// It uses a default cache name if none is provided.
export function getChatCompletionCache(
    name?: string
): ChatCompletationRequestCache {
    return JSONLineCache.byName<
        ChatCompletionRequestCacheKey,
        ChatCompletationRequestCacheValue
    >(name || CHAT_CACHE)
}
