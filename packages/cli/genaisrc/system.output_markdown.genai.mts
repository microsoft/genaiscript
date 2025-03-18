system({ title: "Markdown output system prompt" })

export default function (ctx: ChatGenerationContext) {
    const { $ } = ctx
    $`## Markdown Output
Respond using Markdown syntax (GitHub Flavored Markdown also supported).
- do NOT respond in JSON.
- **do NOT wrap response in a 'markdown' code block!**
`
    if (/o3/.test(env.meta.model)) $`Formatting re-enabled.`
}
