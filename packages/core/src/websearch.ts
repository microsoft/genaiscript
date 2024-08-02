import { BING_SEARCH_ENDPOINT } from "./constants"
import { createFetch } from "./fetch"
import { runtimeHost } from "./host"
import { MarkdownTrace } from "./trace"

function toURLSearchParams(o: any) {
    const params = new URLSearchParams()
    for (const key in o) {
        if (o.hasOwnProperty(key) && o[key] !== undefined) {
            params.append(key, o[key])
        }
    }
    return params.toString()
}

export interface SearchResponse {
    webPages?: {
        value: WebpageResponse[]
    }
}

export interface WebpageResponse {
    snippet: string
    url: string
}

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
    if (!q) return {}

    const apiKey = await runtimeHost.readSecret("BING_SEARCH_API_KEY")
    if (!apiKey)
        throw new Error(
            "BING_SEARCH_API_KEY secret is required to use bing search. See https://microsoft.github.io/genaiscript/reference/scripts/web-search/#bing-web-search-configuration."
        )
    const query = toURLSearchParams({
        q,
        count,
        cc,
        freshness,
        responseFilter,
        safeSearch,
    })
    const url = endPoint + "?" + query
    const fetch = await createFetch()
    const res = await fetch(url, {
        method: "GET",
        headers: {
            "Ocp-Apim-Subscription-Key": apiKey,
        },
    })
    trace?.itemValue(`Bing search`, res.statusText)
    if (!res.ok) {
        trace?.detailsFenced("error response", await res.text())
        throw new Error(`Bing search failed: ${res.statusText}`)
    }

    const json = await res.json()
    trace?.detailsFenced("results", json, "yaml")
    return json
}
