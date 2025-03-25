export let stdout: NodeJS.WriteStream = process.stdout
export let stderr: NodeJS.WriteStream = process.stderr

/**
 * Overrides the standard output stream with the standard error stream.
 * Subsequent writes to stdout will be redirected to stderr.
 */
export function overrideStdoutWithStdErr() {
    stdout = stderr
}
