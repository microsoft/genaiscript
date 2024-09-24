// https://github.com/codelion/optillm/blob/main/optillm/moa.py

export async function mixtureOfAgents(
    query: string,
    options?: PromptGeneratorOptions & { agents: PromptGeneratorOptions[] }
) {
    const {
        agents = [
            { model: "gpt-4o" },
            { model: "gpt-4" },
            { model: "gpt-35-turbo" },
        ],
    } = options ?? {}

    // compute agent responses concurrently
    const agentResponses = await Promise.all(
        agents.map((agent) =>
            runPrompt(
                (ctx) => {
                    ctx.writeText(query)
                    ctx.assistant(`What do you think?`)
                },
                { ...agent, label: agent.label || agent.model }
            )
        )
    )

    // critique
    const { text: critique } = await runPrompt(
        async (_) => {
            _.$`Original query:`
            _.fence(query)
            _.$`I will present you with ${agents.length} candidate responses to the original query. 
    Please analyze and critique each response, discussing their strengths and weaknesses. Provide your analysis for each candidate separately.`
            for (let i = 0; i < agents.length; ++i) {
                const ar = agentResponses[i]
                _.def(`Candidate ${i + 1}`, ar)
            }
            _.$`Please provide your critique for each candidate:`
        },
        { ...(options ?? {}), label: "critique" }
    )

    // final prompt
    const { text: result } = await runPrompt(
        async (_) => {
            _.$`Original query:`
            _.fence(query)
            _.$`Based on the following candidate responses and their critiques, generate a final response to the original query.`
            for (let i = 0; i < agents.length; ++i) {
                const ar = agentResponses[i]
                _.def(`Candidate ${i + 1}`, ar)
            }
            _.def(`Critique`, critique)
            _.$`Please provide a final, optimized response to the original query:`
        },
        { ...(options ?? {}), label: "final" }
    )
    return result
}

const res = await mixtureOfAgents(
    `Roger has 5 tennis balls. He buys 2 more cans of tennis balls. Each can has 3 tennis balls. How many tennis balls does he have now?`
)
console.log(res)
