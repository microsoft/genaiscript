system({
    title: "Today's date.",
})
export default function (ctx: ChatGenerationContext) {
    const { $ } = ctx
    const date = new Date()
    $`- Today is ${date.toDateString()}.`
}
