// This module provides utilities for handling markdown, including prettifying, cleaning,
// generating markdown structures, and parsing trace trees. It supports operations like
// converting annotations to markdown, wrapping text in fences, creating links and details blocks,
// and working with trace trees.

import { convertAnnotationsToMarkdown } from "./annotations"
import { fenceMD } from "./mkmd"
import { convertThinkToMarkdown } from "./think"

/**
 * Prettifies markdown content by converting annotations and cleaning excessive newlines.
 * @param md - The markdown string to be prettified.
 * @returns The prettified markdown string.
 */
export function prettifyMarkdown(md: string) {
    let res = md
    res = convertAnnotationsToMarkdown(res) // Convert annotations to markdown format
    res = convertThinkToMarkdown(res)
    res = cleanMarkdown(res) // Clean up excessive newlines
    return res
}

/**
 * Cleans markdown by reducing multiple consecutive newlines to two.
 * @param res - The string to be cleaned.
 * @returns The cleaned string.
 */
function cleanMarkdown(res: string): string {
    return res?.replace(/(\r?\n){3,}/g, "\n\n")
}

/**
 * Renders an object to a markdown string.
 * @param obj - The object to render.
 * @returns A string representing the markdown of the object.
 */
export function MarkdownStringify(
    obj: any,
    options?: { quoteValues?: boolean }
): string {
    const seen = new Set<any>()
    const { quoteValues } = options || {}
    let indent = -1

    const render = (obj: any): string => {
        if (obj === undefined || obj === null) return obj

        try {
            indent++

            if (Array.isArray(obj)) {
                if (seen.has(obj)) return "..."
                seen.add(obj)
                const items = obj
                    .map((o) => render(o))
                    .filter((i) => i !== undefined && i !== "")
                if (items.some((i) => i.includes("\n")))
                    return `\n<ul>\n${items.map((item) => `<li>\n${item}\n</li>\n`).join("\n")}\n</ul>\n`
                else {
                    const indentText = "  ".repeat(indent)
                    return (
                        "\n" +
                        items.map((item) => `${indentText}- ${item}`).join("\n")
                    )
                }
            } else if (typeof obj === "object") {
                if (seen.has(obj)) return "..."
                seen.add(obj)
                const entries = Object.entries(obj)
                    .map((kv) => [kv[0], render(kv[1])])
                    .filter((kv) => kv[1] !== undefined)
                if (entries.some((kv) => kv[1].includes("\n")))
                    return `\n<ul>\n${entries.map((kv) => `<li>\n${kv[0]}: ${kv[1]}\n</li>\n`).join("\n")}\n</ul>\n`
                else {
                    const indentText = "  ".repeat(indent)
                    return (
                        "\n" +
                        entries
                            .map((kv) => `${indentText}- ${kv[0]}: ${kv[1]}`)
                            .join("\n")
                    )
                }
            } else if (typeof obj === "string") {
                if (quoteValues) {
                    if (obj.includes("\n")) return fenceMD(obj)
                    return `\`${obj.replace(/`/g, "\\`")}\``
                } else return obj
            } else
                return quoteValues
                    ? `\`${String(obj).replace(/`/g, "\\`")}\``
                    : String(obj)
        } finally {
            indent--
        }
    }

    return render(obj)
}
