export declare let consoleColors: boolean;
/**
 * Enables or disables console color output.
 * Updates the global consoleColors flag based on the input.
 * @param enabled - Whether to enable or disable color output.
 */
export declare function setConsoleColors(enabled: boolean): void;
/**
 * Wraps a message with ANSI color codes if colors are enabled.
 * @param n - The color code
 * @param message - The message to wrap
 * @returns The color wrapped message or the original message
 * @see https://en.wikipedia.org/wiki/ANSI_escape_code#3-bit_and_4-bit
 */
/**
 * Wraps a message with ANSI escape codes for the specified color.
 * @param n - The ANSI color code or name to apply.
 * @param message - The message to wrap. Returns the original message if colors are disabled.
 */
export declare function wrapColor(n: number | string, message: string): string;
/**
 * Wraps text with RGB ANSI color codes for foreground or background.
 * Converts an RGB integer to its red, green, and blue components and applies the corresponding ANSI escape codes.
 * Returns the original text if color output is disabled.
 * @param rgb - RGB color as a single integer.
 * @param text - Text to wrap with the color.
 * @param background - Optional. If true, applies the color to the background.
 */
export declare function wrapRgbColor(rgb: number, text: string, background?: boolean): string;
//# sourceMappingURL=consolecolor.d.ts.map
