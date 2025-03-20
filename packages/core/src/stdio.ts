export let stdout: NodeJS.WriteStream = process.stdout
export let stderr: NodeJS.WriteStream = process.stderr

export function overrideStdoutWithStdErr() {
    stdout = stderr
}
