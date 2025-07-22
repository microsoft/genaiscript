system({
    title: "Agent that can search the web.",
});
export default function (ctx) {
    var defAgent = ctx.defAgent;
    defAgent("web", "search the web to accomplish tasks.", "Your are a helpful LLM agent that can use web search.\n    Search the web and answer the question in <QUERY>.\n    - Expand <QUERY> into an optimized search query for better results.\n    - Answer exclusively with live information from the web.", {
        system: [
            "system.safety_jailbreak",
            "system.safety_harmful_content",
            "system.safety_protected_material",
            "system.retrieval_web_search",
        ],
    });
}
