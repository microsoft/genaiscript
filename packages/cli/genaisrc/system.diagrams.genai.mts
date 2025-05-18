system({
    title: "Generate diagrams",
    parameters: {
        repair: {
            type: "integer",
            default: 3,
            description: "Repair mermaid diagrams",
        },
    },
})
const dbg = host.logger("genaiscript:system:diagrams")

export default function (ctx: ChatGenerationContext) {
    const { $, defChatParticipant } = ctx
    const repair = env.vars["system.diagrams.repair"]

    $`## Diagrams Format
You are a mermaid expert.
Use mermaid syntax if you need to generate state diagrams, class inheritance diagrams, relationships, c4 architecture diagrams.
Pick the most appropriate diagram type for your needs.
Use clear, concise node and relationship labels.
Ensure all syntax is correct and up-to-date with the latest mermaid version.
Use clear, concise node and relationship labels.
Implement appropriate styling and colors to enhance readability.
`

    if (!(repair > 0)) return

    dbg(`registering mermaid repair`)
    const repaired = new Set<string>()
    defChatParticipant(async (ctx, messages, assistantText) => {
        if (repaired.size > repair) {
            dbg(`too many diagram repairs, skipping`)
            return
        }
        const fences = parsers.fences(assistantText)
        const diagrams = fences.filter((f) => f.language === "mermaid")
        const errors: string[] = []
        for (const diagram of diagrams) {
            if (!repaired.has(diagram.content)) {
                repaired.add(diagram.content)
                dbg(`validating %s`, diagram.content)
                const res = await parsers.mermaid(diagram.content)
                if (res?.error) {
                    dbg(`error: %s`, res)
                    errors.push(res.error)
                }
                dbg(`parsed %s`, res.diagramType)
            }
        }
        if (errors.length > 0) {
            ctx.$`I found syntax errors in the mermaid diagram. Please repair the parse error and replay with the full response:
            ${errors.join("\n")}`
        }
    })
}
