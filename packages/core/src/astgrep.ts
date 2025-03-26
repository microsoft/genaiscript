import debug from "debug"
const dbg = debug("genaiscript:astgrep")

import { CancellationOptions, checkCancelled } from "./cancellation"
import { CancelError, errorMessage } from "./error"
import { resolveFileContent } from "./file"
import { host } from "./host"
import { uniq } from "es-toolkit"
import { readText, writeText } from "./fs"
import { extname } from "node:path"

class SgChangeSetImpl implements SgChangeSet {
    private pending: Record<string, { root: SgRoot; edits: SgEdit[] }> = {}

    toString() {
        return `changeset ${this.count} edits`
    }

    get count(): number {
        return Object.values(this.pending).reduce(
            (acc, { edits }) => acc + edits.length,
            0
        )
    }

    replace(node: SgNode, text: string) {
        const edit = node.replace(text)
        const root = node.getRoot()
        let rootEdits = this.pending[root.filename()]
        if (rootEdits) {
            if (rootEdits.root !== root) {
                throw new Error(
                    `node ${node} belongs to a different root ${root} than the pending edits ${rootEdits.root}`
                )
            }
        } else this.pending[root.filename()] = { root, edits: [] }
        rootEdits.edits.push(edit)
        return edit
    }
    commit() {
        const files: WorkspaceFile[] = []
        for (const { root, edits } of Object.values(this.pending)) {
            const filename = root.filename()
            const content = root.root().commitEdits(edits)
            files.push({ filename, content })
        }
        return files
    }
}

/**
 * Creates and returns a new instance of a change set for tracking and managing edits in abstract syntax trees (ASTs).
 *
 * @returns A new change set instance to handle editing operations such as replacements and commit edits.
 */
export function astGrepCreateChangeSet(): SgChangeSet {
    return new SgChangeSetImpl()
}

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

    dbg(`finding files with ${lang} %O`, matcher)
    const { findInFiles } = await import("@ast-grep/napi")
    checkCancelled(cancellationToken)
    const sglang = await resolveLang(lang)
    dbg(`resolving language: ${lang}`)

    const paths = await host.findFiles(glob, options)
    if (!paths?.length) {
        dbg(`no files found for glob`, glob)
        return {
            files: 0,
            matches: [],
        }
    }
    dbg(`found ${paths.length} files`, paths)

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

    return { files: scanned, matches }
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
        return await loadDynamicLanguage(lang.toLowerCase())
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
        return await loadDynamicLanguage(
            extname(filename).slice(1).toLowerCase()
        )
    }

    throw new Error("language not resolved")
}

const loadedDynamicLanguages = new Set<string>()
async function loadDynamicLanguage(langName: string) {
    if (!loadedDynamicLanguages.has(langName)) {
        dbg(`loading language: ${langName}`)
        const { registerDynamicLanguage } = await import("@ast-grep/napi")
        try {
            const dynamicLang = (await import(`@ast-grep/lang-${langName}`))
                .default
            registerDynamicLanguage({ [langName]: dynamicLang })
            loadedDynamicLanguages.add(langName)
            dbg(`language ${langName} registered `)
        } catch (err) {
            dbg(`error loading language ${langName}: ${errorMessage(err)}`)
            throw Error(
                `@ast-grep/lang-${langName} package failed to load, please install it using 'npm install -D @ast-grep/lang-${langName}'`
            )
        }
    }
    return langName
}
