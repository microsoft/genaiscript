import {
    BING_SEARCH_ENDPOINT,
    DOCS_WEB_SEARCH_BING_SEARCH_URL,
    DOCS_WEB_SEARCH_TAVILY_URL,
    TAVILY_ENDPOINT,
} from "./constants"
import { createFetch } from "./fetch"
import { runtimeHost } from "./host"
import { MarkdownTrace, TraceOptions } from "./trace"

/**
 * Converts an object into a URL search parameters string.
 * Iterates over object properties and appends them to a URLSearchParams instance.
 * @param o - The object to be converted.
 * @returns A string representing URL search parameters.
 */
function toURLSearchParams(o: any) {
    const params = new URLSearchParams()
    for (const key in o) {
        if (o.hasOwnProperty(key) && o[key] !== undefined) {
            params.append(key, o[key])
        }
    }
    return params.toString()
}

/**
 * Performs a Bing search using the given query and options.
 * Utilizes Bing Search API and constructs the request with query parameters.
 * Handles API key retrieval and error management.
 * @param q - The search query string.
 * @param options - Optional search parameters such as trace, endpoint, count, etc.
 * @returns A Promise resolving to a SearchResponse.
 * @throws Error if the API key is missing or if the search request fails.
 */
export async function bingSearch(
    q: string,
    options?: {
        endPoint?: string
        count?: number
        cc?: string
        freshness?: string
        responseFilter?: string
        safeSearch?: string
    } & TraceOptions
): Promise<WorkspaceFile[]> {
    const {
        trace,
        endPoint = BING_SEARCH_ENDPOINT,
        count,
        cc,
        freshness,
        responseFilter = "Webpages",
        safeSearch = "strict",
    } = options || {}

    // Return an empty response if the query is empty.
    if (!q) return []

    // Retrieve the API key from the runtime host.
    const apiKey = await runtimeHost.readSecret("BING_SEARCH_API_KEY")
    if (!apiKey)
        throw new Error(
            `BING_SEARCH_API_KEY secret is required to use bing search. See ${DOCS_WEB_SEARCH_BING_SEARCH_URL}.`,
            { cause: "missing key" }
        )

    // Construct the query string using provided and default parameters.
    const query = toURLSearchParams({
        q,
        count,
        cc,
        freshness,
        responseFilter,
        safeSearch,
    })

    // Construct the full URL for the search request.
    const url = endPoint + "?" + query

    // Create a fetch function for making the HTTP request.
    const fetch = await createFetch({ trace })
    const res = await fetch(url, {
        method: "GET",
        headers: {
            "Ocp-Apim-Subscription-Key": apiKey,
        },
    })

    // Log the search response status for tracing purposes.
    trace?.itemValue(`Bing search`, res.statusText)

    // Throw an error if the response is not OK, and log details for debugging.
    if (!res.ok) {
        trace?.detailsFenced("error response", await res.text())
        throw new Error(`Bing search failed: ${res.statusText}`)
    }

    // Parse and return the JSON response, logging the results.
    const json = (await res.json()) as {
        webPages?: {
            value: {
                snippet: string
                url: string
            }[]
        }
    }
    trace?.detailsFenced("results", json, "yaml")
    return (
        json.webPages?.value?.map(
            ({ snippet, url }) =>
                ({ filename: url, content: snippet }) satisfies WorkspaceFile
        ) || []
    )
}

/**
 * Performs a Tavily search using the given query and options.
 * Utilizes Tavily Search API and constructs the request with query parameters.
 * Handles API key retrieval and error management.
 * @param q - The search query string.
 * @param options - Optional search parameters such as trace, endpoint, count, etc.
 * @returns A Promise resolving to a SearchResponse.
 * @throws Error if the API key is missing or if the search request fails.
 */
export async function tavilySearch(
    q: string,
    options?: {
        endPoint?: string
        topic?: "general" | "news"
        days?: number
        count?: number
    } & TraceOptions
): Promise<WorkspaceFile[]> {
    const {
        trace,
        endPoint = TAVILY_ENDPOINT,
        topic,
        days,
        count,
    } = options || {}

    // Return an empty response if the query is empty.
    if (!q) return []

    // Retrieve the API key from the runtime host.
    const apiKey = await runtimeHost.readSecret("TAVILY_API_KEY")
    if (!apiKey)
        throw new Error(
            `TAVILY_API_KEY secret is required to use Tavily search. See ${DOCS_WEB_SEARCH_TAVILY_URL}.`,
            { cause: "missing key" }
        )

    // Construct the query string using provided and default parameters.
    const query = toURLSearchParams({
        query: q,
        api_key: apiKey,
        topic,
        days,
        max_results: count,
    })

    // Construct the full URL for the search request.
    const url = endPoint + "?" + query

    // Create a fetch function for making the HTTP request.
    const fetch = await createFetch({ trace })
    console.log({ url })
    const res = await fetch(url, {
        method: "POST",
    })

    // Log the search response status for tracing purposes.
    trace?.itemValue(`Tavily search`, res.statusText)

    // Throw an error if the response is not OK, and log details for debugging.
    if (!res.ok) {
        trace?.detailsFenced("error response", await res.text())
        throw new Error(`Tavily search failed: ${res.statusText}`)
    }

    // Parse and return the JSON response, logging the results.
    const json: {
        query: string
        results: { url: string; description: string }[]
    } = await res.json()
    trace?.detailsFenced("results", json, "yaml")
    return json.results.map(
        ({ url, description }) =>
            ({ filename: url, content: description }) satisfies WorkspaceFile
    )
}
