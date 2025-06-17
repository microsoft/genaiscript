// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { createCache } from "./cache.js";
import type { ChatCompletionResponse, CreateChatCompletionRequest } from "./chattypes.js";
import { CHAT_CACHE } from "./constants.js";
import type { WorkspaceFileCache } from "./types.js";
import type { LanguageModelConfiguration } from "./server/messages.js";

// Define the type for a cache key, which combines chat completion request
// with additional model options, excluding "token" and "source" from the language model configuration.
export type ChatCompletionRequestCacheKey = CreateChatCompletionRequest &
  Omit<LanguageModelConfiguration, "token" | "source">;

// Define a JSON line cache type that maps cache keys to cache values.
// This cache stores chat completion requests and their associated responses.
export type ChatCompletationRequestCache = WorkspaceFileCache<
  ChatCompletionRequestCacheKey,
  ChatCompletionResponse
>;

// Function to retrieve a chat completion cache.
// It uses a default cache name if none is provided.
// This function ensures consistent access to cached chat completions.
export function getChatCompletionCache(name?: string): ChatCompletationRequestCache {
  return createCache<ChatCompletionRequestCacheKey, ChatCompletionResponse>(name || CHAT_CACHE, {
    type: "fs",
  });
}
