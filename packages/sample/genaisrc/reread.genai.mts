// https://arxiv.org/abs/2309.06275

// math preview: goessner.mdmath
export async function reread(
    question: string,
    options?: PromptGeneratorOptions
) {
    return await runPrompt((_) => {
        _.writeText(question)
        _.$`Read the question again:`
        _.writeText(question)
        _.assistant(`Let’s think step by step.`)
    }, options)
}

const res =
    await reread(`Roger has 5 tennis balls. He buys 2 more cans of tennis 
balls. Each can has 3 tennis balls. How many tennis balls 
does he have now?`)

console.log(res.text)
