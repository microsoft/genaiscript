system({
    title: "Instruct to make a plan",
})

export default function (ctx: PromptContext) {
    const { $ } = ctx
    $`Make a plan to achieve your goal.`
}
