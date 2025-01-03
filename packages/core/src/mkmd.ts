import { trimNewlines } from "./unwrappers"

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
