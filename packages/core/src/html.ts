import { convert as convertToText } from "html-to-text"
import { TraceOptions } from "./trace"
import Turndown from "turndown"
import { tabletojson } from "tabletojson"

export function HTMLTablesToJSON(html: string, options?: {}): object[][] {
    const res = tabletojson.convert(html, options)
    return res
}

export function HTMLToText(
    html: string,
    options?: HTMLToTextOptions & TraceOptions
): string {
    if (!html) return ""

    const { trace } = options || {}

    try {
        const text = convertToText(html, options)
        return text
    } catch (e) {
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
        trace?.error("HTML conversion failed", e)
        return undefined
    }
}
