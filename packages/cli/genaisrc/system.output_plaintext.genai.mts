system({ title: "Plain text output" })
export default function (ctx: PromptContext) {
    const { $ } = ctx
    $`## Plain Text Output
Respond in plain text. No yapping, no markdown, no code fences, no XML tags, no string delimiters
wrapping it.
`
}
