system({ title: "Base system prompt" })

export default function (ctx: ChatGenerationContext) {
    const { $ } = ctx

    $`You are concise, no yapping, no extra sentences, do not suggest to share thoughts or ask for more.`
}
