import { convertAnnotationsToMarkdown } from "./annotations"
import { randomHex } from "./crypto"
import { extractFenced } from "./fence"
import { trimNewlines } from "./util"

export function prettifyMarkdown(md: string) {
    let res = md
    res = convertAnnotationsToMarkdown(res)
    res = cleanMarkdown(res)
    return res
}

export function cleanMarkdown(res: string): string {
    return res?.replace(/(\r?\n){3,}/g, "\n\n")
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

export interface ItemNode {
    id?: string
    type: "item"
    label: string
    value: string
}

export interface DetailsNode {
    id?: string
    type: "details"
    label: string
    content: TraceNode[]
}

export type TraceNode = string | DetailsNode | ItemNode

export interface TraceTree {
    root: DetailsNode
    nodes: Record<string, TraceNode>
}

export function parseTraceTree(text: string): TraceTree {
    const nodes: Record<string, TraceNode> = {}
    const stack: DetailsNode[] = [
        { type: "details", label: "root", content: [] },
    ]
    let hash = 0
    const lines = (text || "").split("\n")
    for (let i = 0; i < lines.length; ++i) {
        const line = lines[i]
        for (let j = 0; j < line.length; j++) {
            hash = (hash << 5) - hash + line.charCodeAt(j)
            hash |= 0
        }
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
        const endDetails = /^\s*<\/details>\s*$/m.exec(lines[i])
        if (endDetails) {
            stack.pop()
            continue
        }
        const summary = /^\s*<summary>(.*)<\/summary>\s*$/m.exec(lines[i])
        if (summary) {
            const current = stack.at(-1)
            current.label = summary[1]
            continue
        }
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
        if (typeof lastContent === "string")
            contents[contents.length - 1] = lastContent + "\n" + content
        else contents.push(content)
    }

    return { root: stack[0], nodes }
}

export function renderTraceTree(node: TraceNode): string {
    if (!node) return ""
    if (typeof node === "string") {
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
