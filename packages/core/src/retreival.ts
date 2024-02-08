import { Fetcher } from "openapi-typescript-fetch"

import { paths } from "./openapi"

export function createRetreivalClient(options?: {
    baseUrl?: string
    token: string
    headers: HeadersInit
}) {
    const { baseUrl = "http://localhost:8000/", token, headers } = options ?? {}
    const fetcher = Fetcher.for<paths>()
    fetcher.configure({
        baseUrl,
        init: {
            headers: {
                Authorization: `Bearer ${token}`,
                ...headers,
            },
        },
    })
    const upsert = fetcher.path("/upsert").method("post")
    const upsertFile = fetcher.path("/upsert-file").method("post")
    const query = fetcher.path("/query").method("post")
    const del = fetcher.path("/delete").method("delete")
    return { upsert, upsertFile, del, query }
}
