const dbg = host.logger("genaiscript:prettier")

export async function prettier(
    file: WorkspaceFile,
    options?: { curly?: boolean }
) {
    const args = ["--write"]
    if (options?.curly) args.push("--plugin=prettier-plugin-curly")
    // format
    const res = await host.exec("prettier", [...args, file.filename])
    if (res.exitCode) {
        dbg(`error: %d\n%s`, res.exitCode, res.stderr)
        throw new Error(`${res.stdout} (${res.exitCode})`)
    }
}
