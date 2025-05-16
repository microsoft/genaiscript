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
Use mermaid syntax if you need to generate state diagrams, class inheritance diagrams, relationships.
Pick the most appropriate diagram type for your needs. Be very precise with the mermaid syntax.`

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
            ctx.$`I found syntax errors in the mermaid diagram. Please repair the parse error:
            ${errors.join("\n")}`
        }
    })
}
