import "zx/globals"
export default async function ({ vars }) {
    const { script, spec } = vars
    const { stdout, stderr, exitCode, failed } = await $`../cli/built/genaiscript.cjs run ${script} ${spec} --prompt`
    if (failed) {
        console.error(stdout)
        console.error(stderr)
        throw new Error(`run failed ${exitCode}`)
    }
    return stdout
}