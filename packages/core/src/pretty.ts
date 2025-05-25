import type { ChatCompletionUsage } from "./chattypes"
import _prettyBytes from "pretty-bytes"
import {
    CHAR_DOWN_ARROW,
    CHAR_TEMPERATURE,
    CHAR_UP_ARROW,
    CHAR_UP_DOWN_ARROWS,
} from "./constants"
import { roundWithPrecision } from "./precision"

/**
 * Formats token usage into a human-readable string indicating tokens per second.
 *
 * @param usage - Object containing usage data. Must include:
 *   - `total_tokens`: The total number of tokens used.
 *   - `duration`: The duration of usage in milliseconds.
 * @returns A string representing tokens per second, formatted as "X.XXt/s", or an empty string if input is invalid.
 */
export function prettyTokensPerSecond(usage: ChatCompletionUsage) {
    if (!usage || !usage.duration || !usage.total_tokens) return ""
    return `${(usage.total_tokens / (usage.duration / 1000)).toFixed(2)}t/s`
}

/**
 * Converts a numeric token count into a human-readable string with units.
 *
 * @param n - The number of tokens to format. If not a valid number, returns an empty string.
 * @param direction - Optional indicator for token type:
 *   "prompt" for input tokens (adds "↑" as prefix) or
 *   "completion" for output tokens (adds "↓" as prefix). Defaults to no prefix.
 * @returns A formatted string with units "t" for tokens, "kt" for kilo-tokens, or "Mt" for mega-tokens.
 */
export function prettyTokens(
    n: number,
    direction?: "prompt" | "completion" | "both"
) {
    if (isNaN(n)) return ""
    const prefix =
        direction === "both"
            ? CHAR_UP_DOWN_ARROWS
            : direction === "prompt"
              ? CHAR_UP_ARROW
              : direction === "completion"
                ? CHAR_DOWN_ARROW
                : ""
    if (n < 1000) return `${prefix}${n.toString()}t`
    if (n < 1e6) return `${prefix}${(n / 1e3).toFixed(1)}kt`
    return `${prefix}${(n / 1e6).toFixed(1)}Mt`
}

export function prettyParenthesized(value: any) {
    return value !== undefined ? `(${value})` : ""
}

/**
 * Formats a duration in milliseconds into a human-readable string.
 *
 * @param ms - The duration in milliseconds to format.
 *   - Below 10,000ms: Returns as milliseconds with ceiling applied.
 *   - Between 10,000ms and 60,000ms: Converts to seconds with one decimal.
 *   - Between 60,000ms and 3,600,000ms: Converts to minutes with one decimal.
 *   - Above 3,600,000ms: Converts to hours with one decimal.
 * @returns A formatted string representing the duration.
 */
export function prettyDuration(ms: number) {
    const prefix = ""
    if (ms < 10000) return `${prefix}${Math.ceil(ms)}ms`
    if (ms < 60 * 1000) return `${prefix}${(ms / 1000).toFixed(1)}s`
    if (ms < 60 * 60 * 1000) return `${prefix}${(ms / 60 / 1000).toFixed(1)}m`
    return `${prefix}${(ms / 60 / 60 / 1000).toFixed(1)}h`
}

/**
 * Formats a numeric cost as a string for display.
 *
 * @param value - The numeric cost to format. Must be a non-negative number.
 * @returns The formatted cost as a string, using cents or dollars.
 */
export function prettyCost(value: number) {
    if (!value) return ""
    return value <= 0.01
        ? `${(value * 100).toFixed(3)}¢`
        : value <= 0.1
          ? `${(value * 100).toFixed(2)}¢`
          : `${value.toFixed(2)}$`
}

/**
 * Converts a value representing bytes into a human-readable string.
 * Utilizes the `pretty-bytes` library for formatting.
 *
 * @param bytes - The numeric value to be converted, representing bytes.
 *                 If not a valid number, an empty string is returned.
 * @returns A human-readable string representing the byte value,
 *          e.g., "1.2 kB", "3 MB". Returns an empty string for invalid input.
 */
export function prettyBytes(bytes: number) {
    if (isNaN(bytes)) return ""
    return _prettyBytes(bytes)
}

/**
 * Converts a list of strings into a single comma-separated string.
 *
 * @param token - An array of strings to be processed. Empty, null, or undefined strings are ignored.
 * @returns A single string with valid input strings concatenated and separated by commas.
 */
export function prettyStrings(...token: string[]) {
    const md = token
        .filter((l) => l !== undefined && l !== null && l !== "")
        .join(", ")
    return md
}

export function prettyValue(
    value: number | undefined,
    options?: { emoji?: string; afterEmoji?: string; precision?: number }
) {
    if (isNaN(value)) return ""
    const { emoji = "", afterEmoji = "", precision = 2 } = options || {}
    const v = roundWithPrecision(value, precision)
    const s = `${emoji}${v}${afterEmoji}`
    return s
}

export function prettyTemperature(value: number) {
    return prettyValue(value, { afterEmoji: CHAR_TEMPERATURE, precision: 1 })
}
