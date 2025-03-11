import { splitMarkdown } from "./frontmatter"
import Mustache from "mustache"
import { jinjaRender } from "./jinja"

/**
 * Applies mustache/jinja to the content of a markdown file.
 * @param md
 * @param data
 * @returns
 */
export async function interpolateVariables(
    md: string,
    data: Record<string, any>,
    options?: ImportTemplateOptions
): Promise<string> {
    if (!md || !data) return md
    const { format } = options || {}
    // remove frontmatter
    let { content } = splitMarkdown(md)

    // remove prompty roles
    // https://github.com/microsoft/prompty/blob/main/runtime/prompty/prompty/parsers.py#L113C21-L113C77
    content = content.replace(/^\s*(system|user|assistant)\s*:\s*$/gim, "\n")

    if (content) {
        // remove xml tags
        // https://humanloop.com/docs/prompt-file-format
        if (format === "jinja") content = jinjaRender(content, data ?? {})
        else content = Mustache.render(content, data ?? {})
    }

    return content
}

export const mustacheRender = Mustache.render
