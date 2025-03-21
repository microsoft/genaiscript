import { stdout } from "./stdio"

// Boolean indicating if console supports colors
// Determines if the console supports color output based on terminal capability
export let consoleColors = !!stdout.isTTY

/**
 * Enables or disables console color output.
 * @param enabled - Boolean to enable or disable colors
 */
export function setConsoleColors(enabled: boolean) {
    consoleColors = !!enabled
}

/**
 * Wraps a message with ANSI color codes if colors are enabled.
 * @param n - The color code
 * @param message - The message to wrap
 * @returns The color wrapped message or the original message
 * @see https://en.wikipedia.org/wiki/ANSI_escape_code#3-bit_and_4-bit
 */
// Uses ANSI escape codes to apply color
export function wrapColor(n: number | string, message: string) {
    if (consoleColors) return `\x1B[${n}m${message}\x1B[0m`
    else return message
}

//for (let i = 0; i < 255; ++i)
//    process.stderr.write(wrapColor(`38;5;${i}`, `38;5;${i}\n`))

export function wrapRgbColor(
    rgb: number,
    text: string,
    background?: boolean
): string {
    if (!consoleColors) return text
    const r = (rgb >> 16) & 0xff
    const g = (rgb >> 8) & 0xff
    const b = rgb & 0xff
    const rgbColorCode = `\x1b[${background ? "48" : "38"};2;${r};${g};${b}m`
    const resetCode = `\x1b[0m`
    return `${rgbColorCode}${text}${resetCode}`
}
