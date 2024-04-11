import { convert } from "html-to-text"
import { TraceOptions } from "./trace"

export function HTMLToText(
    html: string,
    options?: HTMLToTextOptions & TraceOptions
) {
    if (!html) return ""
    const { trace } = options || {}

    try {
        const text = convert(html, options)
        return text
    } catch (e) {
        trace?.error("HTML conversion failed", e)
        return undefined
    }
}
