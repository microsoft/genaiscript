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
            query: {
                type: "string",
                description: "Search query.",
            },
        },
        required: ["query"],
    },
    async (args) => {
        const { query } = args
        const webPages = await retrieval.webSearch(query)
        return YAML.stringify(
            webPages.map((f) => ({
                url: f.filename,
                snippet: f.content,
            }))
        )
    }
)
