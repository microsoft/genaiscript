// This module provides utilities for handling markdown, including prettifying, cleaning,
// generating markdown structures, and parsing trace trees. It supports operations like
// converting annotations to markdown, wrapping text in fences, creating links and details blocks,
// and working with trace trees.

import { convertAnnotationsToMarkdown } from "./annotations"
import { randomHex } from "./crypto"
import { extractFenced } from "./fence"
import { trimNewlines } from "./util"

/**
 * Prettifies markdown content by converting annotations and cleaning excessive newlines.
 * @param md - The markdown string to be prettified.
 * @returns The prettified markdown string.
 */
export function prettifyMarkdown(md: string) {
    let res = md
    res = convertAnnotationsToMarkdown(res) // Convert annotations to markdown format
    res = cleanMarkdown(res) // Clean up excessive newlines
    return res
}

/**
 * Cleans markdown by reducing multiple consecutive newlines to two.
 * @param res - The string to be cleaned.
 * @returns The cleaned string.
 */
export function cleanMarkdown(res: string): string {
    return res?.replace(/(\r?\n){3,}/g, "\n\n")
}

/**
 * Wraps text in a markdown code fence, handling nested fences by extending the fence.
 * @param t - The text to be wrapped in a code fence.
 * @param contentType - The type of content, defaulting to "markdown".
 * @returns The text wrapped in a markdown code fence.
 */
export function fenceMD(t: string, contentType?: string) {
    if (t === undefined) return undefined
    if (!contentType) contentType = "markdown"
    let f = "```"
    while (t.includes(f) && f.length < 8) f += "`" // Extend fence if necessary
    return `\n${f}${contentType} wrap\n${trimNewlines(t)}\n${f}\n`
}

/**
 * Creates a markdown link if href is provided, otherwise returns plain text.
 * @param text - The link text.
 * @param href - The URL, if any.
 * @returns A markdown link or plain text.
 */
export function link(text: string, href: string) {
    return href ? `[${text}](${href})` : text
}

/**
 * Generates a markdown details block with an optional open state.
 * @param summary - The summary text for the details block.
 * @param body - The content inside the details block.
 * @param open - Whether the details block should be open by default.
 * @returns A string representing a markdown details block.
 */
export function details(summary: string, body: string, open?: boolean) {
    return `\n<details${open ? " open" : ""}>
<summary>${summary}</summary>

${body}

</details>\n`
}

// Interface representing an item node in a trace tree
export interface ItemNode {
    id?: string // Optional unique identifier
    type: "item"
    label: string // Label for the item
    value: string // Value of the item
}

// Interface representing a details node containing trace nodes
export interface DetailsNode {
    id?: string // Optional unique identifier
    type: "details"
    label: string // Label for the details node
    content: TraceNode[] // Array of trace nodes contained
}

// Type representing possible trace nodes which can be strings, details nodes, or item nodes
export type TraceNode = string | DetailsNode | ItemNode

// Interface representing a trace tree structure
export interface TraceTree {
    root: DetailsNode // Root node of the trace tree
    nodes: Record<string, TraceNode> // Dictionary of nodes by their IDs
}

/**
 * Parses a string into a TraceTree structure, creating nodes for details and items.
 * @param text - The text representing the trace tree.
 * @returns The parsed TraceTree structure.
 */
export function parseTraceTree(text: string): TraceTree {
    const nodes: Record<string, TraceNode> = {}
    const stack: DetailsNode[] = [
        { type: "details", label: "root", content: [] }, // Initialize root node
    ]
    let hash = 0
    const lines = (text || "").split("\n")
    for (let i = 0; i < lines.length; ++i) {
        const line = lines[i]
        // Calculate hash for line
        for (let j = 0; j < line.length; j++) {
            hash = (hash << 5) - hash + line.charCodeAt(j)
            hash |= 0
        }
        // Detect start of a details block
        const startDetails = /^\s*<details[^>]*>\s*$/m.exec(line)
        if (startDetails) {
            const parent = stack.at(-1)
            const current: DetailsNode = {
                type: "details",
                id: `${i}-${hash}`,
                label: "",
                content: [],
            }
            parent.content.push(current)
            stack.push(current)
            nodes[current.id] = current
            continue
        }
        // Detect end of a details block
        const endDetails = /^\s*<\/details>\s*$/m.exec(lines[i])
        if (endDetails) {
            stack.pop()
            continue
        }
        // Detect summary tag and set current label
        const summary = /^\s*<summary>(.*)<\/summary>\s*$/m.exec(lines[i])
        if (summary) {
            const current = stack.at(-1)
            current.label = summary[1]
            continue
        }
        // Handle multi-line summaries
        const startSummary = /^\s*<summary>\s*$/m.exec(lines[i])
        if (startSummary) {
            let j = ++i
            while (j < lines.length) {
                const endSummary = /^\s*<\/summary>\s*$/m.exec(lines[j])
                if (endSummary) break
                j++
            }
            const current = stack.at(-1)
            current.label = lines.slice(i, j).join("\n")
            i = j
            continue
        }
        // Detect item node
        const item = /^\s*-\s+([^:]+): (.+)$/m.exec(lines[i])
        if (item) {
            const current = stack.at(-1)
            current.content.push({
                type: "item",
                id: randomHex(6),
                label: item[1],
                value: item[2],
            })
            nodes[current.id] = current
            continue
        }

        const contents = stack.at(-1).content
        const content = lines[i]
        const lastContent = contents.at(-1)
        // Append to last content if it's a string, otherwise add new content
        if (typeof lastContent === "string")
            contents[contents.length - 1] = lastContent + "\n" + content
        else contents.push(content)
    }

    return { root: stack[0], nodes }
}

/**
 * Renders a TraceNode into a markdown string.
 * @param node - The trace node to render.
 * @returns A string representing the markdown of the node.
 */
export function renderTraceTree(node: TraceNode): string {
    if (!node) return ""
    if (typeof node === "string") {
        // Extract fenced markdown content
        if (/^\s*\`\`\`markdown/.test(node) && /\`\`\`\s*$/.test(node)) {
            const fences = extractFenced(node)
            if (fences?.length === 1) return fences[0].content
        }
        return node
    } else if (node.type === "item") return `- ${node.label}: ${node.value}`
    else if (node.type === "details")
        return details(node.label, node.content.map(renderTraceTree).join("\n"))
    else return ""
}
