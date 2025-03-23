import debug from "debug"
const dbg = debug("genaiscript:astgrep")

import { CancellationOptions, checkCancelled } from "./cancellation"
import { CancelError } from "./error"
import { resolveFileContent } from "./file"
import { host } from "./host"

export async function astGrepFindFiles(
    lang: AstGrepLang,
    glob: ElementOrArray<string>,
    matcher: string | AstGrepMatcher,
    options?: Omit<FindFilesOptions, "readText"> & CancellationOptions
): Promise<{ files: number; matches: AstGrepNode[] }> {
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
    if (!paths?.length) return { files: 0, matches: [] }
    dbg(`found ${paths.length} files`, paths.slice(0, 10))

    const matches: AstGrepNode[] = []
    const p = new Promise<number>(async (resolve, reject) => {
        let i = 0
        let n: number = undefined
        n = await findInFiles(
            sglang,
            {
                paths,
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
