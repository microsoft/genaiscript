system({
    title: "Instruct to make a plan",
})

export default function (ctx: ChatGenerationContext) {
    const { $ } = ctx
    $`Make a plan to achieve your goal.`
}
