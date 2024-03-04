import { MarkdownTrace, RequestError } from "."
import { BING_SEARCH_ENDPOINT } from "./constants"
import { host } from "./host"

function toURLSearchParams(o: any) {
    const params = new URLSearchParams()
    for (const key in o) {
        if (o.hasOwnProperty(key)) {
            params.append(key, o[key])
        }
    }
    return params.toString()
}

export interface SearchResponse {
    _type: string
}

export interface WebpageResponse {
    _type: "webPages"
    name: string
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
): Promise<SearchResponse[]> {
    const {
        trace,
        endPoint = BING_SEARCH_ENDPOINT,
        count,
        cc,
        freshness,
        responseFilter = "Webpages",
        safeSearch = "strict",
    } = options || {}
    if (!q) return []

    const apiKey = host.readSecret("BING_SEARCH_API_KEY")
    if (!apiKey)
        throw new Error(
            "BING_SEARCH_API_KEY secret is required to use bing search"
        )
    const query = {
        q,
        count,
        cc,
        freshness,
        responseFilter,
        safeSearch,
    }
    const res = await fetch(endPoint + "?" + toURLSearchParams(query), {
        method: "GET",
        headers: <any>{
            "Ocp-Apim-Subscription-Key": apiKey,
        },
    })
    if (!res.ok) throw new Error("Bing search failed: " + (await res.text()))

    const json = await res.json()
    return json
}
