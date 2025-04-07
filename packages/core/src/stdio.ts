import { genaiscriptDebug } from "./debug"

const dbg = genaiscriptDebug("stdio")
export let stdout: NodeJS.WriteStream = process.stdout
export let stderr: NodeJS.WriteStream = process.stderr

dbg(`stdout tty: ${stdout.isTTY}`)

/**
 * Overrides the standard output stream with the standard error stream.
 *
 * No parameters are required for this function.
 * After execution, any output written to the standard output stream will
 * instead be redirected to the standard error stream.
 */
export function overrideStdoutWithStdErr() {
    dbg(`overriding stdout with stderr`)
    stdout = stderr
}
