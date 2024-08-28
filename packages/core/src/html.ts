import { convert } from "html-to-text"
import { TraceOptions } from "./trace"
import { logError } from "./util"
import Turndown from "turndown"

export function HTMLToText(
    html: string,
    options?: HTMLToTextOptions & TraceOptions
): string {
    if (!html) return ""

    const { trace } = options || {}

    try {
        const text = convert(html, options)
        return text
    } catch (e) {
        logError(e)
        trace?.error("HTML conversion failed", e)
        return undefined
    }
}

export function HTMLToMarkdown(html: string, options?: TraceOptions): string {
    if (!html) return html
    const { trace } = options || {}

    try {
        const res = new Turndown().turndown(html)
        return res
    } catch (e) {
        logError(e)
        trace?.error("HTML conversion failed", e)
        return undefined
    }
}
