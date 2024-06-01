import { convertAnnotationsToMarkdown } from "./annotations"
import { trimNewlines } from "./util"

export function prettifyMarkdown(md: string) {
    let res = md
    res = convertAnnotationsToMarkdown(res)
    return res
}

export function fenceMD(t: string, contentType?: string) {
    if (!contentType) contentType = "markdown"
    let f = "```"
    while (t.includes(f) && f.length < 8) f += "`"
    return `\n${f}${contentType}\n${trimNewlines(t)}\n${f}\n`
}

export function link(text: string, href: string) {
    return href ? `[${text}](${href})` : text
}
