system({ title: "JSON output" })

export default function (ctx: PromptContext) {
    const { $ } = ctx
    $`## JSON output
Respond in JSON. No yapping, no markdown, no code fences, no XML tags, no string delimiters wrapping it.
`
}
