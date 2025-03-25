import debug from "debug"
const dbg = debug("genaiscript:astgrep")

import { CancellationOptions, checkCancelled } from "./cancellation"
import { CancelError } from "./error"
import { resolveFileContent } from "./file"
import { host } from "./host"
import { uniq } from "es-toolkit"
import { readText, writeText } from "./fs"

/**
 * Searches for files matching a specified glob pattern and applies a matcher to find nodes within those files.
 * 
 * @param lang - The programming language to use for parsing files.
 * @param glob - A pattern or array of patterns to match files.
 * @param matcher - A string or matcher object used to identify nodes in the files.
 * @param options - Options to configure the search process, including cancellation options.
 * 
 * @returns An object containing the number of files scanned, matched nodes, a replace function to modify nodes, 
 *          and a commitEdits function to apply changes to the files.
 * 
 * @throws Error if glob or matcher is not provided.
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
        if (!matches.includes(node))
            throw new Error("node is not included in the matches")
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
 * Writes edits to the roots of the provided nodes. For each unique root,
 * it checks if the current content differs from the updated content. If they 
 * are different, it writes the updated content to the corresponding file.
 * 
 * @param nodes - An array of nodes whose edits need to be written.
 * @param options - Optional settings that may include a cancellation token.
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
 * Parses the content of a given workspace file and resolves its language.
 *
 * This function checks for binary encoding, retrieves the file content, 
 * and utilizes the AST-Grep library to parse the content based on the 
 * specified or inferred language. It supports cancellation tokens to 
 * allow for interruption of long-running processes.
 *
 * @param file The workspace file to be parsed.
 * @param options Optional parameters including language specification 
 *                and cancellation options.
 * @returns The root AST node of the parsed file content, or undefined 
 *          if the file is binary or if the language cannot be resolved.
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
