// Importing constants and utility functions
import {
    ESTIMATE_TOKEN_OVERHEAD,
    MAX_TOKENS_ELLIPSE,
    TOKEN_TRUNCATION_THRESHOLD,
} from "./constants"
import { logVerbose } from "./util"

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
    try {
        // Return the length of the encoded text plus a constant overhead
        return encoder(text).length + ESTIMATE_TOKEN_OVERHEAD
    } catch (e) {
        // If encoding fails, log the error in verbose mode
        logVerbose(e)
        // Fallback: Estimate token count as one-fourth of text length plus overhead
        // This provides a rough estimate in case of encoding errors
        return (text.length >> 2) + ESTIMATE_TOKEN_OVERHEAD
    }
}

// Function to truncate text based on token limits.
export function truncateTextToTokens(
    content: string,
    maxTokens: number,
    encoder: TokenEncoder,
    options?: {
        last?: boolean
        threshold?: number
    }
): string {
    const tokens = estimateTokens(content, encoder)
    if (tokens <= maxTokens) return content
    const { last, threshold = TOKEN_TRUNCATION_THRESHOLD } = options || {}

    let left = 0
    let right = content.length
    let result = content

    while (Math.abs(left - right) > threshold) {
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
    }
    return result
}
