system({
    title: "Agent that can search the web.",
})

export default function main(ctx) {
    const model = ctx.env.vars.agentWebSearchModel
    ctx.defAgent(
        "web",
        "search the web to accomplish tasks.",
        `Your are a helpful LLM agent that can use web search.
    Answer the question in QUERY.`,
        {
            model,
            system: [
                "system.safety_jailbreak",
                "system.safety_harmful_content",
                "system.safety_protected_material",
                "system.retrieval_web_search",
            ],
        }
    )
}
