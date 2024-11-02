import { BING_SEARCH_ENDPOINT } from "./constants"
import { createFetch } from "./fetch"
import { runtimeHost } from "./host"
import { MarkdownTrace } from "./trace"

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
 * Interface representing the response from a search query.
 */
export interface SearchResponse {
    webPages?: {
        value: WebpageResponse[]
    }
}

/**
 * Interface representing a single webpage response.
 */
export interface WebpageResponse {
    snippet: string
    url: string
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
        trace?: MarkdownTrace
        endPoint?: string
        count?: number
        cc?: string
        freshness?: string
        responseFilter?: string
        safeSearch?: string
    }
): Promise<SearchResponse> {
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
    if (!q) return {}

    // Retrieve the API key from the runtime host.
    const apiKey = await runtimeHost.readSecret("BING_SEARCH_API_KEY")
    if (!apiKey)
        throw new Error(
            "BING_SEARCH_API_KEY secret is required to use bing search. See https://microsoft.github.io/genaiscript/reference/scripts/web-search/#bing-web-search-configuration."
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
    const fetch = await createFetch()
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
    const json = await res.json()
    trace?.detailsFenced("results", json, "yaml")
    return json
}
