import debug from "debug"
const dbg = debug("genai:astgrep")
dbg("astgrep module initialized")

import { CancellationOptions, checkCancelled } from "./cancellation"
import { arrayify } from "./cleaners"
import { CancelError } from "./error"
import { resolveFileContent } from "./file"

export async function astGrepFindInFiles(
    lang: AstGrepLang,
    glob: ElementOrArray<string>,
    matcher: string | AstGrepMatcher,
    options?: CancellationOptions
): Promise<{ files: number; matches: AstGrepNode[] }> {
    const { cancellationToken } = options || {}
    if (!glob) {
        throw new Error("glob is required")
    }
    if (!matcher) {
        throw new Error("matcher is required")
    }

    const { findInFiles } = await import("@ast-grep/napi")
    checkCancelled(cancellationToken)
    const sglang = await resolveLang(lang)
    dbg(`resolving language: ${lang}`)

    const matches: AstGrepNode[] = []
    const p = new Promise<number>(async (resolve, reject) => {
        let i = 0
        let n: number = undefined
        n = await findInFiles(
            sglang,
            {
                paths: arrayify(glob),
                matcher:
                    typeof matcher === "string"
                        ? <AstGrepMatcher>{ rule: { pattern: matcher } }
                        : matcher,
            },
            (err, nodes) => {
                if (err) {
                    dbg(`error occurred: ${err}`)
                    throw err
                }
                matches.push(...nodes)
                dbg(`nodes found: ${nodes.length}`)
                if (cancellationToken?.isCancellationRequested) {
                    reject(new CancelError("cancelled"))
                }
                if (i++ === n) {
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

export async function astGrepParse(
    file: WorkspaceFile,
    options?: { lang?: AstGrepLang } & CancellationOptions
): Promise<AstGrepRoot> {
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

    const { parseAsync, Lang } = await import("@ast-grep/napi")
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

async function resolveLang(lang: AstGrepLang, filename?: string) {
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
