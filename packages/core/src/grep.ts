import { TraceOptions } from "./trace"
import { runtimeHost } from "./host"
import { JSONLTryParse } from "./jsonl"
import { unique } from "./util"
import { resolveFileContent } from "./file"
import { installImport } from "./import"
import { RIPGREP_DIST_VERSION } from "./version"

async function tryImportRipgrep(options?: TraceOptions) {
    const { trace } = options || {}
    try {
        const m = await import("@lvce-editor/ripgrep")
        return m
    } catch (e) {
        trace?.error(
            `@lvce-editor/ripgrep not found, installing ${RIPGREP_DIST_VERSION}...`
        )
        await installImport("@lvce-editor/ripgrep", RIPGREP_DIST_VERSION, trace)
        const m = await import("@lvce-editor/ripgrep")
        return m
    }
}

export async function grepSearch(
    query: string,
    globs: string[],
    options?: TraceOptions
): Promise<{ files: WorkspaceFile[] }> {
    const { trace } = options || {}
    const { rgPath } = await tryImportRipgrep(options)
    const args: string[] = ["--json", "--smart-case", query]
    for (const glob of globs) {
        args.push("-g")
        args.push(glob)
    }
    const res = await runtimeHost.exec(undefined, rgPath, args, options)
    const resl = JSONLTryParse(res.stdout) as {
        type: "match"
        data: {
            path: {
                text: string
            }
            lines: { text: string }
            line_number: number
        }
    }[]
    const files = unique(
        resl
            .filter(({ type }) => type === "match")
            .map(({ data }) => data.path.text)
    ).map((filename) => <WorkspaceFile>{ filename })
    for (const file of files) await resolveFileContent(file)
    return { files }
}
