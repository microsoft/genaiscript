import { details } from "./mkmd"

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
                id: ("" + Math.random()).slice(2),
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
export function renderTraceTree(node: TraceNode, level: number): string {
    if (!node) return ""
    if (typeof node === "string") {
        return node
    } else if (node.type === "item") return `- ${node.label}: ${node.value}`
    else if (node.type === "details")
        return details(
            node.label,
            level > 0
                ? node.content
                      .map((n) => renderTraceTree(n, level - 1))
                      .join("\n")
                : "..."
        )
    else return ""
}
