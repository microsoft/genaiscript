import { convertAnnotationsToMarkdown } from "./annotations"
import { trimNewlines } from "./util"

export function prettifyMarkdown(md: string) {
    let res = md
    res = convertAnnotationsToMarkdown(res)
    return res
}

export function fenceMD(t: string, contentType?: string) {
    if (t === undefined) return undefined
    if (!contentType) contentType = "markdown"
    let f = "```"
    while (t.includes(f) && f.length < 8) f += "`"
    return `\n${f}${contentType} wrap\n${trimNewlines(t)}\n${f}\n`
}

export function link(text: string, href: string) {
    return href ? `[${text}](${href})` : text
}

export function details(summary: string, body: string, open?: boolean) {
    return `\n<details${open ? " open" : ""}>
<summary>${summary}</summary>

${body}

</details>\n`
}
