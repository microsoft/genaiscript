import { TraceOptions } from "./trace"
import { runtimeHost } from "./host"

export async function grepSearch(
    query: string,
    globs: string[],
    options?: TraceOptions
): Promise<WorkspaceFile[]> {
    const { rgPath } = await import("@vscode/ripgrep")
    console.log({ rgPath })
    const args: string[] = [query]
    for (const glob of globs) {
        args.push("-g")
        args.push(glob)
    }
    const res = await runtimeHost.exec(undefined, rgPath, args, options)
    console.log(res.stdout)
    return []
}
