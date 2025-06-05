import type { ChatCompletionUsage } from "./chattypes.js";
/**
 * Formats token usage into a human-readable string indicating tokens per second.
 *
 * @param usage - Object containing usage data. Must include:
 *   - `total_tokens`: The total number of tokens used.
 *   - `duration`: The duration of usage in milliseconds.
 * @returns A string representing tokens per second, formatted as "X.XXt/s", or an empty string if input is invalid.
 */
export declare function prettyTokensPerSecond(usage: ChatCompletionUsage): string;
/**
 * Converts a numeric token count into a human-readable string with units.
 *
 * @param n - The number of tokens to format. If not a valid number, returns an empty string.
 * @param direction - Optional indicator for token type:
 *   "prompt" for input tokens (adds "↑" as prefix) or
 *   "completion" for output tokens (adds "↓" as prefix). Defaults to no prefix.
 * @returns A formatted string with units "t" for tokens, "kt" for kilo-tokens, or "Mt" for mega-tokens.
 */
export declare function prettyTokens(
  n: number,
  direction?: "prompt" | "completion" | "both",
): string;
export declare function prettyParenthesized(value: any): string;
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
export declare function prettyDuration(ms: number): string;
/**
 * Formats a numeric cost as a string for display.
 *
 * @param value - The numeric cost to format. Must be a non-negative number.
 * @returns The formatted cost as a string, using cents or dollars.
 */
export declare function prettyCost(value: number): string;
/**
 * Converts a value representing bytes into a human-readable string.
 * Utilizes the `pretty-bytes` library for formatting.
 *
 * @param bytes - The numeric value to be converted, representing bytes.
 *                 If not a valid number, an empty string is returned.
 * @returns A human-readable string representing the byte value,
 *          e.g., "1.2 kB", "3 MB". Returns an empty string for invalid input.
 */
export declare function prettyBytes(bytes: number): string;
/**
 * Converts a list of strings into a single comma-separated string.
 *
 * @param token - An array of strings to be processed. Empty, null, or undefined strings are ignored.
 * @returns A single string with valid input strings concatenated and separated by commas.
 */
export declare function prettyStrings(...token: string[]): string;
export declare function prettyValue(
  value: number | undefined,
  options?: {
    emoji?: string;
    afterEmoji?: string;
    precision?: number;
  },
): string;
export declare function prettyTemperature(value: number): string;
//# sourceMappingURL=pretty.d.ts.map
