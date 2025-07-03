system({
    title: "Agentic Search",
    description:
        "Function to perform intelligent agentic search that combines multiple search strategies with query rewriting.",
})

export default function (ctx: ChatGenerationContext) {
    const { defTool } = ctx
    defTool(
        "agentic_search",
        "Perform agentic search using multiple strategies (vector, web, fuzzy) with intelligent query rewriting.",
        {
            type: "object",
            properties: {
                files: {
                    description: "array of file paths to search,",
                    type: "array",
                    items: {
                        type: "string",
                        description:
                            "path to the file to search, relative to the workspace root",
                    },
                },
                q: {
                    type: "string",
                    description: "Search query.",
                },
                options: {
                    type: "object",
                    description: "Agentic search options",
                    properties: {
                        topK: {
                            type: "number",
                            description: "Maximum number of results to return",
                            default: 10,
                        },
                        minScore: {
                            type: "number",
                            description: "Minimum score threshold for results",
                            default: 0,
                        },
                        includeWebSearch: {
                            type: "boolean",
                            description: "Whether to include web search results",
                            default: true,
                        },
                        includeVectorSearch: {
                            type: "boolean",
                            description: "Whether to include vector search results",
                            default: true,
                        },
                        includeFuzzSearch: {
                            type: "boolean",
                            description: "Whether to include fuzzy search results",
                            default: true,
                        },
                        webSearchProvider: {
                            type: "string",
                            enum: ["bing", "tavily"],
                            description: "Web search provider to use",
                        },
                        embeddingsModel: {
                            type: "string",
                            description: "Embeddings model for vector search",
                        },
                        indexName: {
                            type: "string",
                            description: "Index name for vector search",
                        },
                        queryVariations: {
                            type: "number",
                            description: "Number of query variations to generate",
                            default: 2,
                        },
                        combinationStrategy: {
                            type: "string",
                            enum: ["weighted", "rrf", "simple"],
                            description: "Strategy for combining results",
                            default: "weighted",
                        },
                        searchWeights: {
                            type: "object",
                            description: "Weights for different search types",
                            properties: {
                                vector: {
                                    type: "number",
                                    description: "Weight for vector search results",
                                    default: 0.4,
                                },
                                web: {
                                    type: "number",
                                    description: "Weight for web search results",
                                    default: 0.4,
                                },
                                fuzzy: {
                                    type: "number",
                                    description: "Weight for fuzzy search results",
                                    default: 0.2,
                                },
                            },
                        },
                    },
                },
            },
            required: ["q"],
        },
        async (args) => {
            const { files = [], q, options = {} } = args
            const res = await retrieval.agenticSearch(
                q,
                files.map((filename) => ({ filename })),
                options
            )
            return YAML.stringify(
                res.map(({ filename, score, source, query }) => ({
                    filename,
                    score,
                    source,
                    query,
                }))
            )
        }
    )
}