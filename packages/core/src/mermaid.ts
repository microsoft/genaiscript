import { errorMessage } from "./error"

export async function mermaidParse(
    text: string
): Promise<{ diagramType?: string; error?: string }> {
    const mermaid = (await import("mermaid")).default
    try {
        const res = await mermaid.parse(text, { suppressErrors: true })
        if (!res) return { error: "No result" }
        return { diagramType: res.diagramType }
    } catch (e) {
        return { error: errorMessage(e) }
    }
}
