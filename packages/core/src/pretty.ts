import type { ChatCompletionUsage } from "./chattypes"

export function prettyTokensPerSecond(usage: ChatCompletionUsage) {
    if (!usage || !usage.duration || !usage.total_tokens) return ""
    return `${(usage.total_tokens / (usage.duration / 1000)).toFixed(2)}t/s`
}

export function prettyTokens(n: number, direction?: "prompt" | "completion") {
    if (isNaN(n)) return ""
    const prefix =
        direction === "prompt" ? "↑" : direction === "completion" ? "↓" : ""
    if (n < 1000) return `${prefix}${n.toString()}t`
    if (n < 1e6) return `${prefix}${(n / 1e3).toFixed(1)}kt`
    return `${prefix}${(n / 1e6).toFixed(1)}Mt`
}

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
