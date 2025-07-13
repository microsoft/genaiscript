// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import { createCache } from "./cache.js";
import { CHAT_CACHE } from "./constants.js";
// Function to retrieve a chat completion cache.
// It uses a default cache name if none is provided.
// This function ensures consistent access to cached chat completions.
export function getChatCompletionCache(name) {
    return createCache(name || CHAT_CACHE, {
        type: "fs",
    });
}
//# sourceMappingURL=chatcache.js.map