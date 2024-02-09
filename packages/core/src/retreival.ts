import { Fetcher } from "openapi-typescript-fetch"
import { paths } from "./openapi"
import { host } from "./host"

export interface RetreivalClientOptions {}

async function createRetreivalClient() {
    const baseUrl =
        (await host.readSecret("RETREIVAL_BASE_URL")) || "http://127.0.0.1:8000"
    const token = await host.readSecret("BEARER_TOKEN")
    const fetcher = Fetcher.for<paths>()
    fetcher.configure({
        baseUrl,
        init: {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
    })
    return fetcher
}

export async function upsertFiles(
    files: LinkedFile[],
    options?: RetreivalClientOptions
) {
    const fetcher = await createRetreivalClient()
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
    options?: RetreivalClientOptions
) {
    const fetcher = await createRetreivalClient()
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
            ({ id, text, score, metadata }) => ({
                filename: metadata?.document_id,
                id,
                text,
                score,
            })
        ),
    }
}
