import type { ChatCompletionResponse, CreateChatCompletionRequest } from "./chattypes.js";
import type { LanguageModelConfiguration } from "./server/messages.js";
export type ChatCompletionRequestCacheKey = CreateChatCompletionRequest &
  Omit<LanguageModelConfiguration, "token" | "source">;
export type ChatCompletationRequestCache = WorkspaceFileCache<
  ChatCompletionRequestCacheKey,
  ChatCompletionResponse
>;
export declare function getChatCompletionCache(name?: string): ChatCompletationRequestCache;
//# sourceMappingURL=chatcache.d.ts.map
