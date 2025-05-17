// Importing constants and utility functions
import {
    ESTIMATE_TOKEN_OVERHEAD,
    MAX_STRING_LENGTH_USE_TOKENIZER_FOR_APPROXIMATION,
    MAX_TOKENS_ELLIPSE,
    PROMPT_DOM_TRUNCATE_ATTEMPTS,
    TOKEN_TRUNCATION_THRESHOLD,
} from "./constants"
import { measure } from "./performance"
import { logVerbose } from "./util"
import { genaiscriptDebug } from "./debug"
const dbg = genaiscriptDebug("tokens")
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
export function approximateTokens(
    text: string,
    options?: { overcount?: number; encoder?: TokenEncoder }
): number {
    if (!text) return 0

    const { overcount = 0, encoder } = options || {}
    dbg(`approximate %d chars, encoder: %o`, text.length, !!encoder)
    if (
        encoder &&
        text.length < MAX_STRING_LENGTH_USE_TOKENIZER_FOR_APPROXIMATION
    )
        return estimateTokens(text, encoder)

    // Normalize whitespace
    const normalized = text.trim().replace(/\s+/g, " ")

    // Estimate base on character count
    const charCount = normalized.length

    // Heuristic adjustment: count punctuation and words
    const punctuationCount = (normalized.match(/[.,!?;:]/g) || []).length
    const wordCount = (normalized.match(/\b\w+\b/g) || []).length

    // Weight punctuation and word boundaries slightly higher
    const estimatedTokens =
        charCount / (4 - overcount) + punctuationCount * 0.2 + wordCount * 0.1

    return Math.ceil(estimatedTokens) + ESTIMATE_TOKEN_OVERHEAD
}

/**
 * Estimates the number of tokens in a given text using a provided encoder function.
 * Includes a constant overhead in the result.
 *
 * @param text - The input text to estimate tokens for. If empty or undefined, returns 0.
 * @param encoder - A function that encodes the text into tokens.
 * @returns The estimated token count, including overhead. If an error occurs during encoding, falls back to an approximate token count.
 */
export function estimateTokens(text: string, encoder: TokenEncoder): number {
    // If the text is empty or undefined, return 0
    if (!text?.length) return 0
    dbg(`estimate %d chars`, text.length)
    const m = measure("tokens.estimate", `${text.length} chars`)
    try {
        // Return the length of the encoded text plus a constant overhead
        return encoder(text).length + ESTIMATE_TOKEN_OVERHEAD
    } catch (e) {
        logVerbose(e)
        return approximateTokens(text)
    } finally {
        const duration = m()
        if (duration > 100)
            dbg(`token estimation ${text.length}c: ${duration | 0}ms`)
    }
}

/**
 * /NO P/
 */
export function truncateTextToTokens(
    content: string,
    maxTokens: number,
    encoder: TokenEncoder,
    options?: {
        // precomputed tokens
        tokens?: number
        last?: boolean
        threshold?: number
    }
): string {
    const tokens =
        options?.tokens || approximateTokens(content, { overcount: 0.5 })
    if (tokens <= maxTokens) return content
    const { last, threshold = TOKEN_TRUNCATION_THRESHOLD } = options || {}

    dbg(`starting binary search for token truncation`)
    let attempts = 0
    let left = 0
    let right = content.length
    let result = content

    // since token length is roughly linear, we can start the binary search
    // by slightly adjusting the right bound
    right = Math.ceil((content.length / tokens) * maxTokens)
    result = content.slice(0, right) + MAX_TOKENS_ELLIPSE

    const m = measure("tokens.truncate")
    while (
        Math.abs(left - right) > threshold &&
        attempts++ < PROMPT_DOM_TRUNCATE_ATTEMPTS
    ) {
        const mi = measure(`tokens.truncate.${attempts}`)
        const mid = Math.floor((left + right) / 2)
        dbg(`truncating at ${mid} of ${content.length}`)
        result = last
            ? MAX_TOKENS_ELLIPSE + content.slice(-mid)
            : content.slice(0, mid) + MAX_TOKENS_ELLIPSE
        const truncatedTokens = approximateTokens(result, { encoder })

        if (truncatedTokens > maxTokens) {
            right = mid
        } else {
            left = mid + 1
        }
        mi()
    }
    dbg(`token truncation completed`)
    m()

    return result
}
