import { splitMarkdown } from "./frontmatter"
import Mustache from "mustache"
import { jinjaRender } from "./jinja"

/**
 * Applies Mustache or Jinja templating to the content of a markdown file.
 * @param md The markdown string to process.
 * @param data The data to interpolate into the markdown content.
 * @param options Optional configuration, including templating format.
 * @returns The processed markdown string with variables interpolated.
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
