import { TraceOptions } from "./trace"
import { runtimeHost } from "./host"
import { JSONLTryParse } from "./jsonl"

export async function grepSearch(
    query: string,
    globs: string[],
    options?: TraceOptions
): Promise<WorkspaceFile[]> {
    const { rgPath } = await import("@vscode/ripgrep")
    const args: string[] = ["--json", query]
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
            lines: { text: string; start: number; end: number }
        }
    }[]
    const matches = resl
        .filter(({ type }) => type === "match")
        .map(
            ({ data }) =>
                <WorkspaceFile>{
                    filename: data.path.text,
                    content: data.lines.text,
                }
        )

    return matches
}
