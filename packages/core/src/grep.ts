import { TraceOptions } from "./trace"
import { runtimeHost } from "./host"
import { JSONLTryParse } from "./jsonl"
import { resolveFileContent } from "./file"
import { uniq } from "es-toolkit"

export async function grepSearch(
    query: string | RegExp,
    globs: string[],
    options?: TraceOptions & { readText?: boolean }
): Promise<{ files: WorkspaceFile[] }> {
    const { rgPath } = await import("@lvce-editor/ripgrep")
    const args: string[] = ["--json", "--multiline", "--context", "3"]
    if (typeof query === "string") {
        args.push("--smart-case", query)
    } else {
        if (query.ignoreCase) args.push("--ignore-case")
        args.push(query.source)
    }
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
    const files = uniq(
        resl
            .filter(({ type }) => type === "match")
            .map(({ data }) => data.path.text)
    ).map((filename) => <WorkspaceFile>{ filename })
    if (options?.readText !== false)
        for (const file of files) await resolveFileContent(file)
    return { files }
}
