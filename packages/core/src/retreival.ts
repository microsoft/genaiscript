import type { paths } from "./openapi"
import { host } from "./host"
import createClient from "openapi-fetch"

export interface RetreivalClientOptions {}

async function createRetreivalClient() {
    const token = await host.readSecret("RETREIVAL_TOKEN")
    if (!token) throw new Error("RETREIVAL_TOKEN not found")

    const baseUrl =
        (await host.readSecret("RETREIVAL_BASE_URL")) || "http://127.0.0.1:8000"
    const fetcher = createClient<paths>({
        baseUrl,
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })
    return fetcher
}

export function toDocument(f: LinkedFile) {
    const url = /^https:\/\//.test(f.filename) ? f.filename : undefined
    return {
        id: f.filename,
        text: f.content,
        metadata: {
            source: url ? undefined : ("file" as "file"),
            url,
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
        const { response } = await fetcher.POST("/upsert", {
            body: {
                documents: filesWithText.map(toDocument),
            },
        })
        if (!response.ok)
            throw new Error(`${response.status} ${response.statusText}`)
    }
    if (filesWithoutText.length) {
        const body: Record<string, Blob> = {}
        for (const f of filesWithoutText) {
            const body: any = {
                file: undefined,
                metadata: {
                    source: undefined,
                    url: undefined,
                },
            }
            if (/^http?s:\/\//i.test(f.filename)) {
                const res = await fetch(f.filename)
                body.file = await res.blob()
                body.url = f.filename
            } else {
                const buffer = await host.readFile(f.filename)
                body.file = new Blob([buffer])
                body.source = "file"
            }
            const { response } = await fetcher.POST("/upsert-file", {
                body,
                bodySerializer(body) {
                    const fd = new FormData()
                    for (const [k, v] of Object.entries(body)) {
                        fd.append(k, v)
                    }
                    return fd
                },
            })
            if (!response.ok)
                throw new Error(`${response.status} ${response.statusText}`)
        }
    }
}

export async function query(
    q: string,
    options?: RetreivalClientOptions & { filename?: string }
) {
    const { filename } = options || {}
    const fetcher = await createRetreivalClient()
    const res = await fetcher.POST("/query", {
        body: {
            queries: [
                {
                    query: q,
                    filter: {
                        document_id: filename,
                    },
                },
            ],
        },
    })

    return {
        ok: res.response.ok,
        status: res.response.status,
        statusText: res.response.statusText,
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
