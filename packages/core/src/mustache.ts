import { splitMarkdown } from "./frontmatter"

export async function interpolateVariables(
    md: string,
    data: Record<string, any>
): Promise<string> {
    if (!md || !data) return md

    // remove frontmatter
    const { content } = splitMarkdown(md)
    return content.replace(/{{([^}]+)}}/g, (_, key) => {
        let d = data[key] ?? ""
        if (typeof d === "function") d = d()
        if (typeof d === "object") d = JSON.stringify(d)
        return String(d)
    })
}
