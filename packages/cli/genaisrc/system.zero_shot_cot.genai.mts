system({
    title: "Zero-shot Chain Of Though",
    description:
        "Zero-shot Chain Of Though technique. More at https://learnprompting.org/docs/intermediate/zero_shot_cot.",
})
export default function (ctx: PromptContext) {
    const { $ } = ctx
    $`Let's think step by step.`
}
