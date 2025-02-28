system({
    title: "Use english output",
})

export default function (ctx: ChatGenerationContext) {
    const { $ } = ctx

    $`## English output
Use English in the output of the system. Use English in the reasoning output as well.`
}
