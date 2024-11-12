import { TraceOptions } from "./trace"
import { runtimeHost } from "./host"
import { JSONLTryParse } from "./jsonl"
import { resolveFileContent } from "./file"
import { uniq } from "es-toolkit"
import { addLineNumbers } from "./liner"
import { arrayify } from "./util"

export async function grepSearch(
    query: string | RegExp,
    options?: TraceOptions & {
        path?: string[]
        glob?: string[]
        readText?: boolean
    }
): Promise<{ files: WorkspaceFile[]; matches: WorkspaceFile[] }> {
    const { rgPath } = await import("@lvce-editor/ripgrep")
    const { path: paths, glob: globs, readText } = options || {}
    const args: string[] = ["--json", "--multiline", "--context", "3"]
    if (typeof query === "string") {
        args.push("--smart-case", query)
    } else {
        if (query.ignoreCase) args.push("--ignore-case")
        args.push(query.source)
    }
    if (globs)
        for (const glob of globs) {
            args.push("--glob")
            args.push(glob.replace(/^\*\*\//, ""))
        }
    if (paths) args.push(...arrayify(paths))
    const res = await runtimeHost.exec(undefined, rgPath, args, options)
    const resl = JSONLTryParse(res.stdout) as {
        type: "match" | "context" | "begin" | "end"
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
    const matches = resl
        .filter(({ type }) => type === "match")
        .map(
            ({ data }) =>
                <WorkspaceFile>{
                    filename: data.path.text,
                    content: addLineNumbers(data.lines.text.trimEnd(), {
                        startLine: data.line_number,
                    }),
                }
        )
    if (readText !== false)
        for (const file of files) await resolveFileContent(file)
    return { files, matches }
}
