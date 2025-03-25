import { filenameOrFileToContent } from "./unwrappers"
import { JSON5TryParse } from "./json5"
import { TOMLTryParse } from "./toml"
import { YAMLTryParse, YAMLStringify } from "./yaml"

/**
 * Parses the frontmatter from a given text or workspace file.
 *
 * This function extracts the frontmatter section, which is typically enclosed
 * in triple dashes (---). The frontmatter is then parsed according to the specified
 * format: YAML, JSON, TOML, or plain text. If no frontmatter is found or the text 
 * is invalid, the function returns undefined.
 *
 * @param text - The input text or workspace file containing frontmatter.
 * @param options - Options object to specify the parsing format.
 *    - format: The format of the frontmatter to parse (defaults to "yaml").
 *
 * @returns An object containing the extracted frontmatter text, the parsed value, 
 *          and the line number where the frontmatter ends, or undefined if 
 *          no frontmatter is present.
 */
export function frontmatterTryParse(
    text: string | WorkspaceFile,
    options?: { format: "yaml" | "json" | "toml" | "text" }
): { text: string; value: any; endLine?: number } | undefined {
    text = filenameOrFileToContent(text)

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

/**
 * Splits a markdown text or workspace file into frontmatter and content.
 * 
 * The function identifies frontmatter enclosed by '---' delimiters at the 
 * beginning of the text. If the delimiters are not present or the frontmatter 
 * does not exist, it returns the original content. 
 * 
 * The frontmatter is retrieved from the text and the remaining content is 
 * returned separately. The function also provides the line number where the 
 * frontmatter ends.
 * 
 * @param text - The markdown text or workspace file to be processed.
 * 
 * @returns An object containing the frontmatter, content, and the end line 
 *          number of the frontmatter if applicable.
 */
export function splitMarkdown(text: string | WorkspaceFile): {
    frontmatter?: string
    endLine?: number
    content: string
} {
    text = filenameOrFileToContent(text)
    if (!text) return { content: text }
    const lines = text.split(/\r?\n/g)
    const delimiter = "---"
    if (lines[0] !== delimiter) return { content: text }
    let end = 1
    while (end < lines.length) {
        if (lines[end] === delimiter) break
        end++
    }
    if (end >= lines.length) return { frontmatter: text, content: "" }
    const frontmatter = lines.slice(1, end).join("\n")
    const content = lines.slice(end + 1).join("\n")
    return { frontmatter, content, endLine: end }
}

/**
 * Updates the frontmatter section of a given text. 
 * Merges the provided new frontmatter with the existing one, 
 * allowing deletion of keys by setting their values to null.
 * The frontmatter is formatted according to the specified format.
 *
 * @param text - The original text containing the frontmatter.
 * @param newFrontmatter - The new frontmatter to merge into the existing one.
 * @param options - Optional settings to specify the format of the frontmatter (yaml or json).
 * @returns The updated text with the new frontmatter.
 * 
 * @throws Error if the specified format is unsupported.
 */
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
        } else if (value !== undefined) {
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
