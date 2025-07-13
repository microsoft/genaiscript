system({
    title: "Zero-shot Chain Of Thought",
    description:
        "Zero-shot Chain Of Thought technique. More at https://learnprompting.org/docs/intermediate/zero_shot_cot.",
})
export default function (ctx: ChatGenerationContext) {
    const { $ } = ctx
    $`Let's think step by step.`
}
