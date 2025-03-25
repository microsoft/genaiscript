import { TraceOptions } from "./trace"
import { runtimeHost } from "./host"
import { JSONLTryParse } from "./jsonl"
import { resolveFileContent } from "./file"
import { uniq } from "es-toolkit"
import { addLineNumbers } from "./liner"
import { arrayify } from "./util"
import { filterGitIgnore } from "./gitignore"

/**
 * Performs a grep search across files based on the provided pattern.
 * 
 * This function leverages the ripgrep utility to search for matches in files. It reads
 * the specified paths and applies glob patterns and git ignore rules as needed. The 
 * results include the files searched and the matched content with line numbers.
 * 
 * @param pattern - The search pattern, which can be a string or a regular expression.
 * @param options - Optional settings to configure the search behavior, including paths,
 *                  glob patterns, whether to read text content, and git ignore behavior.
 * 
 * @returns An object containing two arrays: a list of files that were searched and 
 *          a list of matches found within those files.
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
