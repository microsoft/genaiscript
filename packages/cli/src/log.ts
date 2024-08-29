import { stdout } from "node:process"
import console from "node:console"
import {
    CONSOLE_COLOR_DEBUG,
    CONSOLE_COLOR_WARNING,
    CONSOLE_COLOR_ERROR,
    CONSOLE_COLOR_INFO,
} from "../../core/src/constants"

export function info(...args: any[]) {
    console.error(...wrapArgs(CONSOLE_COLOR_INFO, args))
}

export function debug(...args: any[]) {
    if (!isQuiet) console.error(...wrapArgs(CONSOLE_COLOR_DEBUG, args))
}

export function warn(...args: any[]) {
    console.error(...wrapArgs(CONSOLE_COLOR_WARNING, args))
}

export function error(...args: any[]) {
    console.error(...wrapArgs(CONSOLE_COLOR_ERROR, args))
}

export let consoleColors = !!stdout.isTTY

export function setConsoleColors(enabled: boolean) {
    consoleColors = !!enabled
}

// https://en.wikipedia.org/wiki/ANSI_escape_code#3-bit_and_4-bit
export function wrapColor(n: number | string, message: string) {
    if (consoleColors) return `\x1B[${n}m${message}\x1B[0m`
    else return message
}

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

export let isQuiet = false

export function setQuiet(v: boolean) {
    isQuiet = !!v
}
