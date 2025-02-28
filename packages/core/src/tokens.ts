// Importing constants and utility functions
import {
    ESTIMATE_TOKEN_OVERHEAD,
    MAX_TOKENS_ELLIPSE,
    PROMPT_DOM_TRUNCATE_ATTEMPTS,
    TOKEN_TRUNCATION_THRESHOLD,
} from "./constants"
import { originalConsole } from "./globals"
import { measure } from "./performance"
import { logVerbose } from "./util"

/**
 * Rough o(1) token count estimate
 * @param text
 * @returns
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
 * Function to estimate the number of tokens for a given text.
 * Utilizes a provided encoder function to achieve this.
 *
 * @param text - The input text whose tokens are to be estimated.
 * @param encoder - A function that encodes the text into tokens.
 * @returns The estimated number of tokens including an overhead.
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
        if (duration > 5000)
            originalConsole.trace(`tokenized ${text.length} chars`)
    }
}

/**
 * Function to trunace a string to a token limit. This is potentially very expensive.
 * @param content
 * @param maxTokens
 * @param encoder
 * @param options
 * @returns
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
    m()

    return result
}
