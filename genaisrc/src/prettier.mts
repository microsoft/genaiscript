export async function prettier(file: WorkspaceFile) {
    const res = await host.exec("prettier", ["--write", file.filename])
    if (res.exitCode) throw new Error(`${res.stdout} (${res.exitCode})`)
}
