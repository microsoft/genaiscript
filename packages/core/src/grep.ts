import { TraceOptions } from "./trace"
import { runtimeHost } from "./host"
import { JSONLTryParse } from "./jsonl"
import { resolveFileContent } from "./file"
import { uniq } from "es-toolkit"
import { addLineNumbers } from "./liner"
import { arrayify } from "./util"
import { filterGitIgnore } from "./gitignore"

/**
 * Executes a grep-like search across the workspace using ripgrep.
 *
 * @param pattern - The search pattern, either a string or a regular expression.
 * @param options - Optional settings to customize the search behavior:
 *   - `path`: Specifies one or more paths to search.
 *   - `glob`: Array of glob patterns to include or exclude files.
 *   - `readText`: When false, avoids reading file content.
 *   - `applyGitIgnore`: When false, bypasses .gitignore filtering.
 *   - Accepts other trace and workspace-specific options.
 * @returns An object containing:
 *   - `files`: List of files that matched the pattern.
 *   - `matches`: List of detailed matches including filenames and content with line numbers.
 */
export async function grepSearch(
    pattern: string | RegExp,
    options?: TraceOptions & WorkspaceGrepOptions
): Promise<{ files: WorkspaceFile[]; matches: WorkspaceFile[] }> {
    const { rgPath } = await import("@lvce-editor/ripgrep")
    const { path: paths, glob: globs, readText, applyGitIgnore } = options || {}
    const args: string[] = ["--json", "--multiline", "--context", "3"]
    if (typeof pattern === "string") {
        args.push("--smart-case", pattern)
    } else {
        if (pattern.ignoreCase) args.push("--ignore-case")
        args.push(pattern.source)
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
    let filenames = uniq(
        resl
            .filter(({ type }) => type === "match")
            .map(({ data }) => data.path.text)
    )
    if (applyGitIgnore !== false) filenames = await filterGitIgnore(filenames)

    const files = filenames.map((filename) => ({ filename }))
    const filesSet = new Set(filenames)
    const matches = resl
        .filter(({ type }) => type === "match")
        .filter(({ data }) => filesSet.has(data.path.text))
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
