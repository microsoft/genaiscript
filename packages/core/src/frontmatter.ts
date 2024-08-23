import { objectFromMap } from "pdfjs-dist/types/src/shared/util"
import { JSON5TryParse } from "./json5"
import { TOMLTryParse } from "./toml"
import { YAMLTryParse, YAMLStringify } from "./yaml"

export function frontmatterTryParse(
    text: string,
    options?: { format: "yaml" | "json" | "toml" | "text" }
): { text: string; value: any; endLine?: number } | undefined {
    const { format = "yaml" } = options || {}
    const { frontmatter, endLine } = splitMarkdown(text)
    if (!frontmatter) return undefined

    let res: any
    switch (format) {
        case "text":
            res = frontmatter
            break
        case "json":
            res = JSON5TryParse(frontmatter)
            break
        case "toml":
            res = TOMLTryParse(frontmatter)
            break
        default:
            res = YAMLTryParse(frontmatter)
            break
    }
    return { text: frontmatter, value: res, endLine }
}

export function splitMarkdown(text: string): {
    frontmatter?: string
    endLine?: number
    content: string
} {
    if (!text) return { content: text }
    const lines = text.split(/\r?\n/g)
    const delimiter = "---"
    if (lines[0] !== delimiter) return { content: text }
    let end = 1
    while (end < lines.length) {
        if (lines[end] === delimiter) break
        end++
    }
    if (end >= lines.length) return { content: text }
    const frontmatter = lines.slice(1, end).join("\n")
    const content = lines.slice(end + 1).join("\n")
    return { frontmatter, content, endLine: end }
}

export function updateFrontmatter(
    text: string,
    newFrontmatter: any,
    options?: { format: "yaml" | "json" }
): string {
    const { content = "" } = splitMarkdown(text)
    if (newFrontmatter === null) return content

    const frontmatter = frontmatterTryParse(text, options)?.value ?? {}

    // merge object
    for (const [key, value] of Object.entries(newFrontmatter ?? {})) {
        if (value === null) {
            delete frontmatter[key]
        } else {
            frontmatter[key] = value
        }
    }

    const { format = "yaml" } = options || {}
    let fm: string
    switch (format) {
        case "json":
            fm = JSON.stringify(frontmatter, null, 2)
            break
        case "yaml":
            fm = YAMLStringify(frontmatter)
            break
        default:
            throw new Error(`Unsupported format: ${format}`)
    }
    return `---\n${fm}\n---\n${content}`
}
