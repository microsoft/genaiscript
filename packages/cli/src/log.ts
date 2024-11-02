import { stdout } from "node:process"
import console from "node:console"
import {
    CONSOLE_COLOR_DEBUG,
    CONSOLE_COLOR_WARNING,
    CONSOLE_COLOR_ERROR,
    CONSOLE_COLOR_INFO,
} from "../../core/src/constants"

// This module provides logging functions with optional console color support
// Logging levels include info, debug, warn, and error

/**
 * Logs informational messages with optional color.
 * Utilizes console.error to print to stderr.
 * @param args - The arguments to log
 */
export function info(...args: any[]) {
    console.error(...wrapArgs(CONSOLE_COLOR_INFO, args))
}

/**
 * Logs debug messages with optional color.
 * Suppresses output if 'isQuiet' is true.
 * Utilizes console.error to print to stderr.
 * @param args - The arguments to log
 */
export function debug(...args: any[]) {
    if (!isQuiet) console.error(...wrapArgs(CONSOLE_COLOR_DEBUG, args))
}

/**
 * Logs warning messages with optional color.
 * Utilizes console.error to print to stderr.
 * @param args - The arguments to log
 */
export function warn(...args: any[]) {
    console.error(...wrapArgs(CONSOLE_COLOR_WARNING, args))
}

/**
 * Logs error messages with optional color.
 * Utilizes console.error to print to stderr.
 * @param args - The arguments to log
 */
export function error(...args: any[]) {
    console.error(...wrapArgs(CONSOLE_COLOR_ERROR, args))
}

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

/**
 * Wraps arguments for logging, applying color if appropriate.
 * Combines string and number arguments into a single colored message.
 * @param color - The color code
 * @param args - The arguments to process
 * @returns An array with either color wrapped or original arguments
 */
function wrapArgs(color: number, args: any[]) {
    if (
        consoleColors &&
        args.every((e) => typeof e == "string" || typeof e == "number")
    ) {
        // if it's just strings & numbers use the coloring
        const msg = args.join(" ")
        return [wrapColor(color, msg)]
    } else {
        // otherwise use the console.log() etc built-in formatting
        return args
    }
}

// Boolean indicating if debug messages should be suppressed
// Controls whether debug messages are outputted
export let isQuiet = false

/**
 * Sets the quiet mode for suppressing debug messages.
 * @param v - Boolean to enable or disable quiet mode
 */
export function setQuiet(v: boolean) {
    isQuiet = !!v
}
