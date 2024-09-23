import { splitMarkdown } from "./frontmatter"
import Mustache from "mustache"

/**
 * Applies mustache to the content of a markdown file.
 * @param md
 * @param data
 * @returns
 */
export async function interpolateVariables(
    md: string,
    data: Record<string, any>
): Promise<string> {
    if (!md || !data) return md

    // remove frontmatter
    let { content } = splitMarkdown(md)

    // remove prompty roles
    // https://github.com/microsoft/prompty/blob/main/runtime/prompty/prompty/parsers.py#L113C21-L113C77
    content = content.replace(/^\s*(system|user|assistant)\s*:\s*$/gim, "\n")

    // remove xml tags
    // https://humanloop.com/docs/prompt-file-format

    content = Mustache.render(content, data ?? {})

    return content
}

export const mustacheRender = Mustache.render
