import { CancellationOptions, checkCancelled } from "./cancellation"
import { arrayify } from "./cleaners"
import { CancelError } from "./error"
import { resolveFileContent } from "./file"

export async function astGrepFindInFiles(
    lang: AstGrepLang,
    glob: ElementOrArray<string>,
    options: CancellationOptions
): Promise<{ files: number; matches: AstGrepNode[] }> {
    const { cancellationToken } = options
    const { findInFiles } = await import("@ast-grep/napi")
    checkCancelled(cancellationToken)
    const sglang = await resolveLang(lang)

    const matches: AstGrepNode[] = []
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
                matches.push(...nodes)
                if (cancellationToken?.isCancellationRequested)
                    reject(new CancelError("cancelled"))
                if (i++ === n) resolve(n)
            }
        )
        if (n === i)
            // we might be ahead of the callbacks
            resolve(n)
    })
    const scanned = await p
    checkCancelled(cancellationToken)

    return { files: scanned, matches }
}

export async function astGrepParse(
    file: WorkspaceFile,
    options: { lang?: AstGrepLang } & CancellationOptions
): Promise<AstGrepRoot> {
    const { cancellationToken } = options || {}
    await resolveFileContent(file)
    checkCancelled(cancellationToken)
    const { filename, encoding, content } = file
    if (encoding) return undefined // binary file

    const { parseAsync, Lang } = await import("@ast-grep/napi")
    const lang = await resolveLang(options?.lang, filename)
    if (!lang) return undefined
    const root = await parseAsync(lang, content)
    checkCancelled(cancellationToken)
    return root
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
