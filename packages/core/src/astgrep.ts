import { CancellationOptions, checkCancelled } from "./cancellation"
import { arrayify } from "./cleaners"
import { CancelError } from "./error"
import { resolveFileContent } from "./file"

export interface AstGrepEdit {
    /** The start position of the edit */
    startPos: number
    /** The end position of the edit */
    endPos: number
    /** The text to be inserted */
    insertedText: string
}

export interface AstGrepPos {
    /** line number starting from 0 */
    line: number
    /** column number starting from 0 */
    column: number
    /** byte offset of the position */
    index: number
}
export interface AstGrepRange {
    /** starting position of the range */
    start: AstGrepPos
    /** ending position of the range */
    end: AstGrepPos
}

export interface AstGrepNode {
    id(): number
    range(): AstGrepRange
    isLeaf(): boolean
    isNamed(): boolean
    isNamedLeaf(): boolean
    text(): string
    matches(m: string | number): boolean
    inside(m: string | number): boolean
    has(m: string | number): boolean
    precedes(m: string | number): boolean
    follows(m: string | number): boolean
    kind(): any
    is(kind: string): boolean
    getMatch(mv: string): AstGrepNode | null
    getMultipleMatches(m: string): Array<AstGrepNode>
    getTransformed(m: string): string | null
    getRoot(): AstGrepRoot
    children(): Array<AstGrepNode>
    find(matcher: string | number): AstGrepNode | null
    findAll(matcher: string | number): Array<AstGrepNode>
    field(name: string): AstGrepNode | null
    fieldChildren(name: string): AstGrepNode[]
    parent(): AstGrepNode | null
    child(nth: number): AstGrepNode | null
    child(nth: number): AstGrepNode | null
    ancestors(): Array<AstGrepNode>
    next(): AstGrepNode | null
    nextAll(): Array<AstGrepNode>
    prev(): AstGrepNode | null
    prevAll(): Array<AstGrepNode>
    replace(text: string): AstGrepEdit
    commitEdits(edits: Array<AstGrepEdit>): string
}

export interface AstGrepRoot {
    /** Returns the root SgNode of the ast-grep instance. */
    root(): AstGrepNode
    /**
     * Returns the path of the file if it is discovered by ast-grep's `findInFiles`.
     * Returns `"anonymous"` if the instance is created by `lang.parse(source)`.
     */
    filename(): string
}

export interface AstGrep {
    parse(file: WorkspaceFile, options: { lang?: string }): Promise<AstGrepRoot>
    findInFiles(glob: ElementOrArray<string>): Promise<AstGrepNode[]>
}

export type AstGrepLang = OptionsOrString<"html" | "js" | "ts" | "tsx" | "css">

export async function astGrepFindInFiles(
    lang: AstGrepLang,
    glob: ElementOrArray<string>,
    options: CancellationOptions
): Promise<AstGrepNode[]> {
    const { cancellationToken } = options
    const { findInFiles } = await import("@ast-grep/napi")
    checkCancelled(cancellationToken)
    const sglang = await resolveLang(lang)

    const res: AstGrepNode[] = []
    const p = new Promise<number>(async (resolve, reject) => {
        let i = 0
        let n = await findInFiles(
            sglang,
            {
                paths: arrayify(glob),
                matcher: {
                    rule: { kind: "member_expression" },
                },
            },
            (err, nodes) => {
                if (err) throw err
                res.push(...nodes)
                if (cancellationToken?.isCancellationRequested)
                    reject(new CancelError("cancelled"))
                if (i++ === n) resolve(n)
            }
        )
        if (n === i)
            // we might be ahead of the callbacks
            resolve(n)
    })
    await p
    checkCancelled(cancellationToken)

    return res
}

export async function astGrepParse(
    file: WorkspaceFile,
    options: { lang?: AstGrepLang }
): Promise<AstGrepRoot> {
    await resolveFileContent(file)
    const { filename, encoding, content } = file
    if (encoding) return undefined // binary file

    const { parseAsync, Lang } = await import("@ast-grep/napi")
    const lang = await resolveLang(options?.lang, filename)
    if (!lang) return undefined
    const root = await parseAsync(lang, content)
    return root

    function resolveLang(lang: AstGrepLang, filename: string) {
        if (lang === "html") return Lang.Html
        if (lang === "js") return Lang.JavaScript
        if (lang === "ts") return Lang.TypeScript
        if (lang === "tsx") return Lang.Tsx
        if (lang === "css") return Lang.Css
        if (lang) return lang

        if (/\.m?js$/i.test(filename)) return Lang.JavaScript
        if (/\.m?ts$/i.test(filename)) return Lang.TypeScript
        if (/\.(j|t)sx$/i.test(filename)) return Lang.Tsx
        if (/\.html$/i.test(filename)) return Lang.Html
        if (/\.css$/i.test(filename)) return Lang.Css

        return undefined
    }
}

async function resolveLang(lang: AstGrepLang, filename?: string) {
    const { Lang } = await import("@ast-grep/napi")
    if (lang === "html") return Lang.Html
    if (lang === "js") return Lang.JavaScript
    if (lang === "ts") return Lang.TypeScript
    if (lang === "tsx") return Lang.Tsx
    if (lang === "css") return Lang.Css
    if (lang) return lang

    if (filename) {
        if (/\.m?js$/i.test(filename)) return Lang.JavaScript
        if (/\.m?ts$/i.test(filename)) return Lang.TypeScript
        if (/\.(j|t)sx$/i.test(filename)) return Lang.Tsx
        if (/\.html$/i.test(filename)) return Lang.Html
        if (/\.css$/i.test(filename)) return Lang.Css
    }
    return undefined
}
