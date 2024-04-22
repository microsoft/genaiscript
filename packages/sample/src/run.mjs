import { execa } from "execa"
export default async function ({ vars }) {
    const { script, spec } = vars
    const command = 'node'
    const args = ['../cli/built/genaiscript.cjs', 'run', script, spec, '--prompt']
    const timeout = 120000
    const cwd = '.'
    const { stdout, stderr, exitCode, failed } = await execa(command, args, {
        cleanup: true,
        timeout,
        cwd,
        preferLocal: true,
        stripFinalNewline: true,
    })
    if (failed) {
        console.error(stdout)
        console.error(stderr)
        throw new Error(`run failed ${exitCode}`)
    }
    const prompt = stdout
    return prompt
}