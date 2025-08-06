system({
    title: "Chain Of Draft reasoning",
    description:
        "Chain of Draft reasoning technique. More at https://learnprompting.org/docs/intermediate/zero_shot_cot.",
})
export default function (ctx: ChatGenerationContext) {
    const { $ } = ctx
    $` Think step by step, but only keep a minimum draft for
 each thinking step, with 5 words at most.`
}
