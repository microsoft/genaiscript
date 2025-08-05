"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.approximateTokens = approximateTokens;
exports.estimateTokens = estimateTokens;
exports.truncateTextToTokens = truncateTextToTokens;
// Importing constants and utility functions
const constants_js_1 = require("./constants.js");
const performance_js_1 = require("./performance.js");
const util_js_1 = require("./util.js");
const debug_js_1 = require("./debug.js");
const dbg = (0, debug_js_1.genaiscriptDebug)("tokens");
/**
 * Estimates the token count of a given text by dividing its length
 * by an approximate token length and adding a constant overhead.
 *
 * If an encoder is provided and the text length is below a threshold,
 * uses the encoder for a more accurate estimate.
 *
 * @param text The input text to estimate tokens for. If empty, returns 0.
 * @param options Optional parameters:
 *   - overcount: Adjusts the token length by subtracting this value from 4. Defaults to 0.
 *   - encoder: Optional encoder function for more accurate estimation on short texts.
 * @returns The estimated token count, including overhead.
 */
function approximateTokens(text, options) {
    if (!text)
        return 0;
    const { overcount = 0, encoder } = options || {};
    dbg(`approximate %d chars, encoder: %o`, text.length, !!encoder);
    if (encoder && text.length < constants_js_1.MAX_STRING_LENGTH_USE_TOKENIZER_FOR_APPROXIMATION)
        return estimateTokens(text, encoder);
    // Normalize whitespace
    const normalized = text.trim().replace(/\s+/g, " ");
    // Estimate base on character count
    const charCount = normalized.length;
    // Heuristic adjustment: count punctuation and words
    const punctuationCount = (normalized.match(/[.,!?;:]/g) || []).length;
    const wordCount = (normalized.match(/\b\w+\b/g) || []).length;
    // Weight punctuation and word boundaries slightly higher
    const estimatedTokens = charCount / (4 - overcount) + punctuationCount * 0.2 + wordCount * 0.1;
    return Math.ceil(estimatedTokens) + constants_js_1.ESTIMATE_TOKEN_OVERHEAD;
}
/**
 * Estimates the number of tokens in a given text using a provided encoder function.
 * Includes a constant overhead in the result.
 *
 * @param text - The input text to estimate tokens for. If empty or undefined, returns 0.
 * @param encoder - A function that encodes the text into tokens.
 * @returns The estimated token count, including overhead. If an error occurs during encoding, falls back to an approximate token count.
 */
function estimateTokens(text, encoder) {
    // If the text is empty or undefined, return 0
    if (!text?.length)
        return 0;
    dbg(`estimate %d chars`, text.length);
    const m = (0, performance_js_1.measure)("tokens.estimate", `${text.length} chars`);
    try {
        // Return the length of the encoded text plus a constant overhead
        return encoder(text).length + constants_js_1.ESTIMATE_TOKEN_OVERHEAD;
    }
    catch (e) {
        (0, util_js_1.logVerbose)(e);
        return approximateTokens(text);
    }
    finally {
        const duration = m();
        if (duration > 100)
            dbg(`token estimation ${text.length}c: ${duration | 0}ms`);
    }
}
/**
 * /NO P/
 */
function truncateTextToTokens(content, maxTokens, encoder, options) {
    const tokens = options?.tokens || approximateTokens(content, { overcount: 0.5 });
    if (tokens <= maxTokens)
        return content;
    const { last, threshold = constants_js_1.TOKEN_TRUNCATION_THRESHOLD } = options || {};
    dbg(`starting binary search for token truncation`);
    let attempts = 0;
    let left = 0;
    let right = content.length;
    let result = content;
    // since token length is roughly linear, we can start the binary search
    // by slightly adjusting the right bound
    right = Math.ceil((content.length / tokens) * maxTokens);
    result = content.slice(0, right) + constants_js_1.MAX_TOKENS_ELLIPSE;
    const m = (0, performance_js_1.measure)("tokens.truncate");
    while (Math.abs(left - right) > threshold && attempts++ < constants_js_1.PROMPT_DOM_TRUNCATE_ATTEMPTS) {
        const mi = (0, performance_js_1.measure)(`tokens.truncate.${attempts}`);
        const mid = Math.floor((left + right) / 2);
        dbg(`truncating at ${mid} of ${content.length}`);
        result = last
            ? constants_js_1.MAX_TOKENS_ELLIPSE + content.slice(-mid)
            : content.slice(0, mid) + constants_js_1.MAX_TOKENS_ELLIPSE;
        const truncatedTokens = approximateTokens(result, { encoder });
        if (truncatedTokens > maxTokens) {
            right = mid;
        }
        else {
            left = mid + 1;
        }
        mi();
    }
    dbg(`token truncation completed`);
    m();
    return result;
}
//# sourceMappingURL=tokens.js.map