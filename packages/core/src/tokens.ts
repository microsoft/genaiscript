import debug from "debug"
const dbg = debug("genaiscript:tokens")

// Importing constants and utility functions
import {
    ESTIMATE_TOKEN_OVERHEAD,
    MAX_TOKENS_ELLIPSE,
    PROMPT_DOM_TRUNCATE_ATTEMPTS,
    TOKEN_TRUNCATION_THRESHOLD,
} from "./constants"
import { measure } from "./performance"
import { logVerbose } from "./util"

/**
 * Estimates the token count of a given text by dividing its length
 * by an approximate token length and adding a constant overhead.
 * 
 * @param text The input text to estimate tokens for.
 * @param options Optional parameters to adjust the overcount factor, which modifies the token length.
 * @returns The estimated token count, including overhead.
 */
export function approximateTokens(
    text: string,
    options?: { overcount?: 1 | 2 }
) {
    if (!text) return 0
    const tokenLength = 4 - (options?.overcount || 0)
    // Fallback: Estimate token count as one-fourth of text length plus overhead
    // This provides a rough estimate in case of encoding errors
    return Math.ceil(text.length / tokenLength) + ESTIMATE_TOKEN_OVERHEAD
}

/**
 * Estimates the number of tokens in a given text using a provided encoder function. 
 * Includes a constant overhead in the result.
 *
 * @param text - The input text to estimate tokens for.
 * @param encoder - Function to encode the text into tokens.
 * @returns Estimated token count, including overhead.
 */
export function estimateTokens(text: string, encoder: TokenEncoder) {
    // If the text is empty or undefined, return 0
    if (!text?.length) return 0
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
 * Truncates a string to fit within a specified token limit. 
 * Utilizes a binary search approach for efficiency.
 * 
 * @param content - The text content to truncate.
 * @param maxTokens - The token limit to enforce.
 * @param encoder - The function to encode text into tokens.
 * @param options - Additional options:
 *   - tokens: Precomputed token count of the content.
 *   - last: Truncate from the end of the content if true.
 *   - threshold: Minimum token adjustment threshold for binary search.
 * @returns Truncated content adjusted to fit within the token limit.
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
        options?.tokens || approximateTokens(content, { overcount: 1 })
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
        const truncatedTokens = estimateTokens(result, encoder)

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
