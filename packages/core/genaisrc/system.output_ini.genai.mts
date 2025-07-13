system({ title: "INI output" })

export default function (ctx: ChatGenerationContext) {
    const { $ } = ctx
    $`## INI output
Respond in INI. No yapping, no markdown, no code fences, no XML tags, no string delimiters wrapping it.
`
}
