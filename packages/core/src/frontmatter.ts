import { JSON5TryParse } from "./json5"
import { TOMLTryParse } from "./toml"
import { YAMLTryParse, YAMLStringify } from "./yaml"

export function frontmatterTryParse(
    text: string,
    options?: { format: "yaml" | "json" | "toml" }
): { end: number; value: any } {
    if (!text) return undefined

    const { format = "yaml" } = options || {}

    const lines = text.split(/\r?\n/g)
    const delimiter = "---"
    if (lines[0] !== delimiter) return undefined
    let end = 1
    while (end < lines.length) {
        if (lines[end] === delimiter) break
        end++
    }
    if (end >= lines.length) return undefined
    const fm = lines.slice(1, end).join("\n")
    let res: any
    switch (format) {
        case "json":
            res = JSON5TryParse(fm)
            break
        case "toml":
            res = TOMLTryParse(fm)
            break
        default:
            res = YAMLTryParse(fm)
            break
    }
    return res !== undefined ? { end: end + 1, value: res } : undefined
}

export function splitMarkdown(
    text: string,
    options?: { format: "yaml" | "json" | "toml" }
): { frontmatter: any; content: string } {
    const { value: frontmatter, end } = frontmatterTryParse(text, options) || {}
    const content = end ? text.split(/\r?\n/g).slice(end).join("\n") : text
    return { frontmatter, content }
}

export function updateFrontmatter(
    text: string,
    newFrontmatter: any,
    options?: { format: "yaml" | "json" }
): string {
    const { format = "yaml" } = options || {}
    const { content } = splitMarkdown(text, options)
    let fm: string
    switch (format) {
        case "json":
            fm = JSON.stringify(newFrontmatter, null, 2)
            break
        case "yaml":
            fm = YAMLStringify(newFrontmatter)
            break
        default:
            throw new Error(`Unsupported format: ${format}`)
    }
    return `---\n${fm}\n---\n${content}`
}
