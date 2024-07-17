/**
 * Uses the Tavily API to search for a query.
 * @param query question
 * @param apiKey API key https://docs.tavily.com/docs/tavily-api/rest_api
 * @returns
 */
export async function tavilySearch(query: string): Promise<{
    answer: string
    query: string
    results: {
        title: string
        url: string
        content: string
        score: number
    }[]
}> {
    const apiKey = env.secrets.TAVILY_API_KEY
    if (!apiKey) throw new Error("secret TAVILY_API_KEY is not available")

    const res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            "api_key": apiKey,
            query,
            include_answer: true,
            max_results: 5,
        }),
    })
    const data: any = await res.json()
    return data
}
