system({
    title: "Today's date.",
    activation: ["today"],
})
export default function (ctx: ChatGenerationContext) {
    const { $ } = ctx
    const date = new Date()
    $`- Today is ${date.toDateString()}.`
}
