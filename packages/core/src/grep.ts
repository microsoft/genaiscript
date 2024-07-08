import { installImport } from "./import"
import { TraceOptions } from "./trace"
import { RIPGREP_DIST_VERSION } from "./version"
import { runtimeHost } from "./host"

async function tryImportRipgrep(options?: TraceOptions) {
    const { trace } = options || {}
    try {
        const m = await import(`@vscode/ripgrep`)
        return m
    } catch (e) {
        trace?.error(
            `dockerode not found, installing ${RIPGREP_DIST_VERSION}...`
        )
        await installImport("@vscode/ripgrep", RIPGREP_DIST_VERSION, trace)
        const m = await import("@vscode/ripgrep")
        return m
    }
}

export async function grepSearch(
    query: string,
    globs: string[],
    options?: TraceOptions
): Promise<WorkspaceFile[]> {
    const { rgPath } = await tryImportRipgrep(options)
    const args: string[] = [`'${query}'`, ...globs.map((g) => `-g '${g}'`)]
    const res = await runtimeHost.exec(undefined, rgPath, args, options)
    console.log(res.stdout)
    return []
}
