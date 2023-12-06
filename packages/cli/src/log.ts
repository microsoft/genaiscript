export const coarchFolder = ".gptools"
export const coarchExt = ".gptools.jsonl"

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

export function fatal(msg: string): never {
    error("fatal error: " + msg)
    process.exit(1)
}

export let consoleColors = true

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

export let isVerbose = 1
export let isQuiet = false

export function incVerbose() {
    isVerbose++
    verboseLog(`verbose level: ${isVerbose}`)
}

export function setQuiet(v: boolean) {
    isQuiet = v
}

export function verboseLog(msg: string) {
    if (isVerbose) console.debug(wrapColor(90, msg))
}
