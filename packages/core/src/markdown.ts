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

export interface DetailsNode {
    label: string
    content: (string | DetailsNode)[]
}

export function parseDetailsTree(text: string): DetailsNode {
    const stack: DetailsNode[] = [{ label: "root", content: [] }]
    const lines = text?.split("\n")
    for (let i = 0; i < lines.length; ++i) {
        const startDetails = /^\s*<details( open)>\s*$/m.exec(lines[i])
        if (startDetails) {
            const parent = stack.at(-1)
            const current: DetailsNode = { label: "", content: [] }
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

        const contents = stack.at(-1).content
        const content = lines[i]
        const lastContent = contents.at(-1)
        if (typeof lastContent === "string")
            contents[contents.length - 1] = lastContent + "\n" + content
        else contents.push(content)
    }

    return stack[0]
}
