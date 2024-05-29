import { stdout } from "node:process"
import console from "node:console"

export const info = console.error

export function debug(...args: any[]) {
    if (!isQuiet) console.error(...wrapArgs(34, args))
}

export function warn(...args: any[]) {
    console.error(...wrapArgs(95, args))
}

export function error(...args: any[]) {
    console.error(...wrapArgs(91, args))
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
