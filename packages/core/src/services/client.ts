import { Fetcher } from "openapi-typescript-fetch"

import { paths } from "./api"

export function createAPIClient(options?: {
    baseUrl?: string
    headers: HeadersInit
}) {
    const { baseUrl = "http://localhost:8083/", headers } = options ?? {}
    const fetcher = Fetcher.for<paths>()
    fetcher.configure({
        baseUrl,
        init: {
            headers,
        },
    })
    const search = fetcher.path("/search").method("get").create()
    const status = fetcher.path("/status").method("get").create()
    return { status, search }
}
