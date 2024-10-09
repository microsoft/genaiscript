system({
    title: "agent that retrieves memories",
})

const cache = await host.cache("agent_memory")
defAgent(
    "memory",
    "queries the memories created by other agent conversations.",
    async (ctx) => {
        const memories = await cache.values()
        ctx.$`Your are a helpfull LLM agent that acts as a knowledge base for memories created by other agents.

    Answer the question in QUERY with the memories in MEMORY.

    - Use the information in MEMORY exclusively to answer the question in QUERY.
    - If the information in MEMORY is not enough to answer the question in QUERY, respond <NO_MEMORY>.
    - The memory 
    `
        memories.reverse().forEach(
            ({ agent, query, answer }) =>
                ctx.def(
                    "MEMORY",
                    `${agent}> ${query}?
                ${answer}
                `
                ),
            {
                flex: 1,
            }
        )
    },
    {
        model: "large",
        flexTokens: 30000,
        system: ["system"],
        disableMemory: true,
    }
)
