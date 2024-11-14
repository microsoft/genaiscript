system({
    title: "Agent that can search the web.",
})

const model = env.vars.agentWebSearchModel

defAgent(
    "web-search",
    "search the web to accomplish tasks.",
    `Your are a helpful LLM agent that can use web search.
    Answer the question in QUERY.`,
    {
        model,
        system: ["system.retrieval_fuzz_search", "system.retrieval_web_search"],
    }
)
