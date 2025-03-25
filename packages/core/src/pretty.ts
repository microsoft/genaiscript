import type { ChatCompletionUsage } from "./chattypes"

/**
 * Calculates and formats the tokens processed per second based on usage metrics.
 *
 * @param usage - An object containing usage metrics including duration and total tokens.
 * @returns A formatted string representing the tokens processed per second, or an empty string if inputs are invalid.
 */
export function prettyTokensPerSecond(usage: ChatCompletionUsage) {
    if (!usage || !usage.duration || !usage.total_tokens) return ""
    return `${(usage.total_tokens / (usage.duration / 1000)).toFixed(2)}t/s`
}

/**
 * Formats the given number of tokens for display, indicating whether they 
 * are associated with a prompt or a completion. 
 * The output will be in plain tokens, kilotokens, or megatokens based on the value.
 *
 * @param n - The number of tokens to format.
 * @param direction - Optional parameter to specify the direction ('prompt' or 'completion').
 * @returns A formatted string representing the number of tokens.
 */
export function prettyTokens(n: number, direction?: "prompt" | "completion") {
    if (isNaN(n)) return ""
    const prefix =
        direction === "prompt" ? "↑" : direction === "completion" ? "↓" : ""
    if (n < 1000) return `${prefix}${n.toString()}t`
    if (n < 1e6) return `${prefix}${(n / 1e3).toFixed(1)}kt`
    return `${prefix}${(n / 1e6).toFixed(1)}Mt`
}

/**
 * Converts a duration in milliseconds to a human-readable string format.
 *
 * Renders the duration as milliseconds for values less than 10 seconds,
 * seconds for values less than 1 minute, minutes for values less than
 * 1 hour, and hours for values equal to or greater than 1 hour.
 *
 * @param ms - The duration in milliseconds to be formatted.
 * @returns A string representation of the formatted duration.
 */
export function prettyDuration(ms: number) {
    const prefix = ""
    if (ms < 10000) return `${prefix}${Math.ceil(ms)}ms`
    if (ms < 60 * 1000) return `${prefix}${(ms / 1000).toFixed(1)}s`
    if (ms < 60 * 60 * 1000) return `${prefix}${(ms / 60 / 1000).toFixed(1)}m`
    return `${prefix}${(ms / 60 / 60 / 1000).toFixed(1)}h`
}

/**
 * Renders the cost as a string for display purposes.
 *
 * @param value - The cost to be rendered.
 * @returns A string representation of the cost.
 */
export function prettyCost(value: number) {
    if (!value) return ""
    return value <= 0.01
        ? `${(value * 100).toFixed(3)}¢`
        : value <= 0.1
          ? `${(value * 100).toFixed(2)}¢`
          : `${value.toFixed(2)}$`
}
