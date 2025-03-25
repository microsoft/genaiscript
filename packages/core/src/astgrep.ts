import debug from "debug"
const dbg = debug("genaiscript:astgrep")

import { CancellationOptions, checkCancelled } from "./cancellation"
import { CancelError } from "./error"
import { resolveFileContent } from "./file"
import { host } from "./host"
import { uniq } from "es-toolkit"
import { readText, writeText } from "./fs"

/**
 * Searches for files matching specific criteria based on file patterns and match rules,
 * and performs analysis or modifications on matched nodes in the files.
 *
 * @param lang - The language of the files to search, such as JavaScript or HTML.
 * @param glob - A single or array of glob patterns to match file paths.
 * @param matcher - The match criteria, either a string pattern or a specific matcher object.
 * @param options - Optional parameters, including cancelation options and options for file search.
 *
 * @returns An object containing:
 * - `files`: The number of files scanned.
 * - `matches`: The list of matched nodes.
 * - `replace`: A function to replace a matched node with the provided text.
 * - `commitEdits`: A function to commit all pending edits and return updated file content.
 *
 * @throws An error if `glob` or `matcher` is not provided.
 */
export async function astGrepFindFiles(
    lang: SgLang,
    glob: ElementOrArray<string>,
    matcher: string | SgMatcher,
    options?: Omit<FindFilesOptions, "readText"> & CancellationOptions
): ReturnType<Sg["search"]> {
    const { cancellationToken } = options || {}
    if (!glob) {
        throw new Error("glob is required")
    }
    if (!matcher) {
        throw new Error("matcher is required")
    }

    dbg(`finding files with ${lang}`)
    const { findInFiles } = await import("@ast-grep/napi")
    checkCancelled(cancellationToken)
    const sglang = await resolveLang(lang)
    dbg(`resolving language: ${lang}`)

    const paths = await host.findFiles(glob, options)
    if (!paths?.length)
        return {
            files: 0,
            matches: [],
            replace: () => {
                throw new Error("Not matched nodes")
            },
            commitEdits: async () => [],
        }
    dbg(`found ${paths.length} files`, paths.slice(0, 10))

    const matches: SgNode[] = []
    const p = new Promise<number>(async (resolve, reject) => {
        let i = 0
        let n: number = undefined
        n = await findInFiles(
            sglang,
            {
                paths,
                matcher:
                    typeof matcher === "string"
                        ? <SgMatcher>{ rule: { pattern: matcher } }
                        : matcher,
            },
            (err, nodes) => {
                if (err) {
                    dbg(`error occurred: ${err}`)
                    throw err
                }
                dbg(`nodes found: ${nodes.length}`)
                matches.push(...nodes)
                if (cancellationToken?.isCancellationRequested) {
                    reject(new CancelError("cancelled"))
                }
                if (++i === n) {
                    dbg(`resolving promise with count: ${n}`)
                    resolve(n)
                }
            }
        )
        if (n === i) {
            dbg("resolving promise as callbacks might be ahead")
            // we might be ahead of the callbacks
            resolve(n)
        }
    })
    const scanned = await p
    dbg(`files scanned: ${scanned}`)
    checkCancelled(cancellationToken)

    const pending: Record<string, { root: SgRoot; edits: SgEdit[] }> = {}
    const replace = (node: SgNode, text: string) => {
        const edit = node.replace(text)
        const root = node.getRoot()
        const rootEdits =
            pending[root.filename()] ||
            (pending[root.filename()] = { root, edits: [] })
        rootEdits.edits.push(edit)
        return edit
    }
    const commitEdits = async () => {
        const files: WorkspaceFile[] = []
        for (const { root, edits } of Object.values(pending)) {
            checkCancelled(cancellationToken)
            const filename = root.filename()
            const content = root.root().commitEdits(edits)
            files.push({ filename, content })
        }
        return files
    }

    return { files: scanned, matches, replace, commitEdits }
}

/**
 * Writes edits to the roots of the provided nodes to their corresponding files.
 *
 * @param nodes - An array of AST nodes whose root edits need to be written.
 * @param options - Optional configuration for cancellation, containing a cancellation token to handle operation interruptions.
 *
 * The function iterates through the unique roots of the provided nodes, checks for file content differences,
 * and writes updated content to the respective files if changes are detected.
 */
export async function astGrepWriteRootEdits(
    nodes: SgNode[],
    options?: CancellationOptions
) {
    const { cancellationToken } = options || {}
    const roots = uniq(nodes.map((n) => n.getRoot()))
    dbg(`writing edits to roots: ${roots.length}`)
    for (const root of roots) {
        checkCancelled(cancellationToken)

        const filename = root.filename()
        if (!filename) continue

        const existing = await readText(filename)
        const updated = root.root().text()
        if (existing !== updated) {
            dbg(`writing changes to root: ${filename}`)
            await writeText(filename, updated)
        }
    }
}

/**
 * Parses a given file into an abstract syntax tree (AST) root node.
 *
 * @param file - The input file to parse. Must include filename, encoding, and content properties.
 * @param options - Optional parameters:
 *   - lang: Specifies the programming or markup language for parsing. If not provided, attempts to infer from the file name.
 *   - cancellationToken: Optional cancellation token to abort the operation if necessary.
 *
 * @returns The parsed AST root node. Returns undefined if the file is binary or language cannot be resolved.
 *
 * Notes:
 * - Skips binary files based on the `encoding` property.
 * - Automatically resolves file content before parsing.
 * - Uses the library "@ast-grep/napi" for parsing.
 */
export async function astGrepParse(
    file: WorkspaceFile,
    options?: { lang?: SgLang } & CancellationOptions
): Promise<SgRoot> {
    const { cancellationToken } = options || {}
    if (file.encoding) {
        dbg("ignore binary file")
        return undefined
    } // binary file

    await resolveFileContent(file)
    checkCancelled(cancellationToken)
    const { filename, encoding, content } = file
    if (encoding) {
        dbg("ignore binary file")
        return undefined
    } // binary file

    dbg(`parsing file: ${filename}`)
    const { parseAsync } = await import("@ast-grep/napi")
    const lang = await resolveLang(options?.lang, filename)
    dbg(`resolving language for file: ${filename}`)
    if (!lang) {
        return undefined
    }
    dbg("parsing file content")
    const root = await parseAsync(lang, content)
    checkCancelled(cancellationToken)
    return root
}

async function resolveLang(lang: SgLang, filename?: string) {
    const { Lang } = await import("@ast-grep/napi")
    if (lang === "html") {
        return Lang.Html
    }
    if (lang === "js") {
        return Lang.JavaScript
    }
    if (lang === "ts") {
        return Lang.TypeScript
    }
    if (lang === "tsx") {
        return Lang.Tsx
    }
    if (lang === "css") {
        return Lang.Css
    }
    if (lang) {
        return lang
    }

    if (filename) {
        dbg(`resolving language based on filename: ${filename}`)
        if (/\.m?js$/i.test(filename)) {
            return Lang.JavaScript
        }
        if (/\.m?ts$/i.test(filename)) {
            return Lang.TypeScript
        }
        if (/\.(j|t)sx$/i.test(filename)) {
            return Lang.Tsx
        }
        if (/\.html$/i.test(filename)) {
            return Lang.Html
        }
        if (/\.css$/i.test(filename)) {
            return Lang.Css
        }
    }
    return undefined
}
