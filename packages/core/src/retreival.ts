import { Fetcher } from "openapi-typescript-fetch"
import { paths } from "./openapi"
import { host } from "./host"

export interface RetreivalClientOptions {}

async function createRetreivalClient() {
    const token = await host.readSecret("RETREIVAL_TOKEN")
    if (!token) throw new Error("RETREIVAL_TOKEN not found")

    const baseUrl =
        (await host.readSecret("RETREIVAL_BASE_URL")) || "http://127.0.0.1:8000"
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

export function toDocument(f: LinkedFile) {
    return {
        id: f.filename,
        text: f.content,
        metadata: {
            source: "file" as "file",
            url: /^https:\/\//.test(f.filename) ? f.filename : undefined,
        },
    }
}

export async function upsert(
    fileOrUrls: (string | LinkedFile)[],
    options?: RetreivalClientOptions
) {
    if (!fileOrUrls.length) return

    const fetcher = await createRetreivalClient()

    const files: LinkedFile[] = fileOrUrls.map((f) =>
        typeof f === "string" ? <LinkedFile>{ filename: f } : f
    )

    const filesWithText = files.filter((f) => f.content)
    const filesWithoutText = files.filter((f) => !f.content)

    if (filesWithText.length) {
        const upsertApi = fetcher.path("/upsert").method("post").create()
        const res = await upsertApi({
            documents: filesWithText.map(toDocument),
        })
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
    }
    if (filesWithoutText.length) {
        const formData = new FormData()
        for (const f of filesWithoutText) {
            if (/^http?s:\/\//.test(f.filename)) {
                const res = await fetch(f.filename)
                const blob = await res.blob()
                formData.append(f.filename, blob)
            } else {
                const buffer = await host.readFile(f.filename)
                formData.append(f.filename, new Blob([buffer]))
            }
        }
        const upsertFileApi = fetcher
            .path("/upsert-file")
            .method("post")
            .create()
        const res = await upsertFileApi(
            {},
            {
                body: formData,
            }
        )
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
    }
}

export async function query(
    q: string,
    options?: RetreivalClientOptions & { filename?: string }
) {
    const { filename } = options || {}
    const fetcher = await createRetreivalClient()
    const api = fetcher.path("/query").method("post").create()

    const res = await api({
        queries: [
            {
                query: q,
                filter: {
                    document_id: filename,
                },
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
