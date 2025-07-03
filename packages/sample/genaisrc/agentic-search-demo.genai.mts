script({
    title: "Agentic Search Demo",
    description: "Demonstrates the agentic search functionality",
    model: "openai:gpt-4o-mini",
    system: ["system.retrieval_agentic_search"]
})

const { files, vars } = env
const { question } = vars
if (!question) cancel("Please provide a question to search for")

// Use the agentic search tool to find relevant content
const searchResults = await retrieval.agenticSearch(
    question,
    files,
    {
        topK: 5,
        queryVariations: 3,
        combinationStrategy: "weighted",
        includeWebSearch: true,
        includeVectorSearch: true,
        includeFuzzSearch: true,
        searchWeights: {
            vector: 0.5,
            web: 0.3,
            fuzzy: 0.2
        }
    }
)

def("SEARCH_RESULTS", searchResults, { flex: 2 })

$`Based on the search results, please provide a comprehensive answer to: "${question}"

Consider information from all sources (vector search, web search, fuzzy search) and synthesize a cohesive response.
Include relevant citations and indicate which source type provided key information.`