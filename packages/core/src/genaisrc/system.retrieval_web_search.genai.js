system({
    title: "Web Search",
    description: "Function to do a web search.",
    secrets: ["BING_SEARCH_ENDPOINT"],
})

defTool(
    "retrieval_web_search",
    "Search the web for a user query using Bing Search.",
    {
        type: "object",
        properties: {
            q: {
                type: "string",
                description: "Search query.",
            },
        },
        required: ["q"],
    },
    async (args) => {
        const { q } = args
        const webPages = await retrieval.webSearch(q)
        return YAML.stringify(
            webPages.map((f) => ({
                url: f.filename,
                snippet: f.content,
            }))
        )
    }
)
