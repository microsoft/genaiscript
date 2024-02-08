import { Fetcher } from "openapi-typescript-fetch"
import { paths } from "./openapi"

export interface RetreivalClientOptions {
    baseUrl?: string
    token: string
    headers?: HeadersInit
}

export async function parseTokenFromEnv(
    env: Record<string, string>
): Promise<RetreivalClientOptions> {
    return {
        baseUrl: env.RETREIVAL_BASE_URL,
        token: env.RETREIVAL_BEARER_TOKEN || env.BEARER_TOKEN,
    }
}

function createRetreivalClient(options: RetreivalClientOptions) {
    const {
        baseUrl = "http://localhost:8000/",
        token,
        headers = {},
    } = options ?? {}
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
    return fetcher
}

export async function upsertFiles(
    files: LinkedFile[],
    options: RetreivalClientOptions
) {
    const fetcher = createRetreivalClient(options)
    const api = fetcher.path("/upsert").method("post").create()

    const res = await api({
        documents: files.map((f) => ({
            id: f.filename,
            text: f.content,
            metadata: {
                source: "file",
                url: /^https:\/\//.test(f.filename) ? f.filename : undefined,
            },
        })),
    })

    return {
        ok: res.ok,
        status: res.status,
        statusText: res.statusText,
    }
}

export async function queryFiles(
    query: string,
    options: RetreivalClientOptions
) {
    const fetcher = createRetreivalClient(options)
    const api = fetcher.path("/query").method("post").create()

    const res = await api({
        queries: [
            {
                query,
                filter: { source: "file" },
            },
        ],
    })

    return {
        ok: res.ok,
        status: res.status,
        statusText: res.statusText,
        results: res.data?.results?.[0]?.results?.map(
            ({ id, text, score }) => ({
                id,
                text,
                score,
            })
        ),
    }
}
