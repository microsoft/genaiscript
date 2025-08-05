"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChatCompletionCache = getChatCompletionCache;
const cache_js_1 = require("./cache.js");
const constants_js_1 = require("./constants.js");
// Function to retrieve a chat completion cache.
// It uses a default cache name if none is provided.
// This function ensures consistent access to cached chat completions.
function getChatCompletionCache(name) {
    return (0, cache_js_1.createCache)(name || constants_js_1.CHAT_CACHE, {
        type: "fs",
    });
}
//# sourceMappingURL=chatcache.js.map