import { splitMarkdown } from "./frontmatter"

export async function interpolateVariables(
    md: string,
    data: Record<string, any>
): Promise<string> {
    if (!md || !data) return md

    // remove frontmatter
    let { content } = splitMarkdown(md)

    // remove prompty roles
    // https://github.com/microsoft/prompty/blob/main/runtime/prompty/prompty/parsers.py#L113C21-L113C77
    content = content.replace(/^\s*(system|user):\s*$/mgi, "\n")

    // expand mustache like, 1 deep variables
    return content.replace(/{{([^}]+)}}/g, (_, key) => {
        let d = data[key] ?? ""
        if (typeof d === "function") d = d()
        if (typeof d === "object") d = JSON.stringify(d)
        return String(d)
    })
}
