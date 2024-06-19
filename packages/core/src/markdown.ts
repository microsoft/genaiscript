import { convertAnnotationsToMarkdown } from "./annotations"
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
    type: "item"
    label: string
    value: string
}

export interface DetailsNode {
    type: "details"
    label: string
    content: (string | DetailsNode | ItemNode)[]
}

export function parseDetailsTree(text: string): DetailsNode {
    const stack: DetailsNode[] = [
        { type: "details", label: "root", content: [] },
    ]
    const lines = (text || "").split("\n")
    for (let i = 0; i < lines.length; ++i) {
        const startDetails = /^\s*<details[^>]*>\s*$/m.exec(lines[i])
        if (startDetails) {
            const parent = stack.at(-1)
            const current: DetailsNode = {
                type: "details",
                label: "",
                content: [],
            }
            parent.content.push(current)
            stack.push(current)
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
        const item = /^\s*-\s+([^:]+):(.+)$/m.exec(lines[i])
        if (item) {
            const current = stack.at(-1)
            current.content.push({
                type: "item",
                label: item[1],
                value: item[2],
            })
            continue
        }

        const contents = stack.at(-1).content
        const content = lines[i]
        const lastContent = contents.at(-1)
        if (typeof lastContent === "string")
            contents[contents.length - 1] = lastContent + "\n" + content
        else contents.push(content)
    }

    return stack[0]
}
