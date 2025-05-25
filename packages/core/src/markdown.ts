// This module provides utilities for handling markdown, including prettifying, cleaning,
// generating markdown structures, and parsing trace trees. It supports operations like
// converting annotations to markdown, wrapping text in fences, creating links and details blocks,
// and working with trace trees.

import { titleize } from "./inflection"
import { convertAnnotationsToMarkdown } from "./annotations"
import { collapseNewlines } from "./cleaners"
import { fenceMD } from "./mkmd"
import { convertThinkToMarkdown } from "./think"
import { resolveFileDataUri } from "./file"
import { CancellationOptions, checkCancelled } from "./cancellation"
import { HTTP_OR_S_REGEX } from "./constants"
import { genaiscriptDebug } from "./debug"
import { join, resolve } from "node:path"
import { unfence } from "./unwrappers"
const dbg = genaiscriptDebug("markdown")

/**
 * Prettifies markdown content by converting annotations to markdown, processing "think" blocks, and collapsing excessive newlines.
 * @param md - The markdown string to prettify.
 * @returns The cleaned and formatted markdown string.
 */
export function prettifyMarkdown(md: string) {
    let res = unfence(md, ["markdown", "md", "text"])
    res = convertAnnotationsToMarkdown(res) // Convert annotations to markdown format
    res = convertThinkToMarkdown(res)
    res = collapseNewlines(res) // Clean up excessive newlines
    return res
}

/**
 * Converts an object to a markdown string with options for quoting values, limiting heading levels, and customizing indentation.
 * Handles circular references by replacing them with ellipses.
 * Supports rendering arrays, objects, and strings with optional quoting.
 * @param obj - The object to convert.
 * @param options - Optional settings for quoting string values, maximum heading depth, and base heading level.
 * @returns The markdown representation of the object.
 */
export function MarkdownStringify(
    obj: any,
    options?: {
        quoteValues?: boolean
        headings?: number
        headingLevel?: number
    }
): string {
    const seen = new Set<any>()
    const { quoteValues, headings = -1, headingLevel = 2 } = options || {}
    const render = (obj: any, depth: number): string => {
        if (obj === undefined || obj === null) return obj

        const indent = depth
        if (Array.isArray(obj)) {
            if (seen.has(obj)) return "..."
            seen.add(obj)
            const items = obj
                .map((o) => render(o, depth + 1))
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
                .map((kv) => [kv[0], render(kv[1], depth + 1)])
                .filter((kv) => kv[1] !== undefined)
            if (depth <= headings) {
                return entries
                    .map(
                        (kv) =>
                            `\n${"#".repeat(headingLevel + depth)} ${titleize(kv[0])}\n${kv[1]}`
                    )
                    .join("\n")
            } else if (entries.some((kv) => kv[1].includes("\n")))
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
    }

    return render(obj, 0) + "\n"
}

/**
 * Splits a markdown string into an array of parts, where each part is either a text block or an image block.
 * Image blocks are objects of the form { type: "image", alt: string, url: string }. Only local images are supported.
 * Text blocks are objects of the form { type: "text", text: string }.
 * @param markdown The markdown string to split.
 */
export async function splitMarkdownTextImageParts(
    markdown: string,
    options?: CancellationOptions & {
        dir?: string
        allowedDomains?: string[]
        convertToDataUri?: boolean
    }
) {
    const {
        dir = "",
        cancellationToken,
        allowedDomains,
        convertToDataUri,
    } = options || {}
    // remove \. for all images
    const regex = /^!\[(?<alt>[^\]]*)\]\((?<imageUrl>\.[^)]+)\)$/gm
    const parts: (
        | { type: "text"; text: string }
        | { type: "image"; data: string; mimeType: string }
    )[] = []
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = regex.exec(markdown)) !== null) {
        checkCancelled(cancellationToken)
        if (match.index > lastIndex) {
            const text = markdown.slice(lastIndex, match.index)
            if (text) parts.push({ type: "text", text })
        }

        const { alt, imageUrl } = match.groups

        let data: string
        let mimeType: string
        const isDataUri = /^datauri:\/\//.test(imageUrl)
        if (isDataUri) {
            // TODO
        } else if (HTTP_OR_S_REGEX.test(imageUrl)) {
            // TODO
        } else if (/^\./.test(imageUrl)) {
            dbg(`local image: %s`, imageUrl)
            if (convertToDataUri) {
                const filename = resolve(join(dir, imageUrl))
                dbg(`local file: %s`, filename)
                try {
                    const res = await resolveFileDataUri(filename, options)
                    data = res.data
                    mimeType = res.mimeType
                } catch (err) {
                    dbg(`%O`, err)
                }
            }
        }
        if (data && mimeType) {
            parts.push({ type: "image", data, mimeType })
        } else {
            const lastPart = parts.at(-1)
            if (lastPart?.type === "text") lastPart.text += match[0]
            else parts.push({ type: "text", text: match[0] })
        }
        lastIndex = regex.lastIndex
    }
    if (lastIndex < markdown.length) {
        const text = markdown.slice(lastIndex)
        if (text) parts.push({ type: "text", text })
    }
    return parts
}
