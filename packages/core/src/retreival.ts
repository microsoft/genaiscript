import type { paths } from "./openapi"
import { host } from "./host"
import createClient from "openapi-fetch"
import { lookup } from "mime-types"
import { Progress } from "./progress"
import { MarkdownTrace } from "./trace"

export interface RetreivalClientOptions {
    progress?: Progress
    trace?: MarkdownTrace
}

const SUPPORTED_MIME_TYPES = [
    "text/plain",
    "text/markdown",
    "text/csv",
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]

export function isIndexable(filename: string) {
    const type = lookup(filename) || "text/plain"
    return SUPPORTED_MIME_TYPES.includes(type)
}

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
    const { progress, trace } = options || {}
    const fetcher = await createRetreivalClient()

    const files: LinkedFile[] = fileOrUrls.map((f) =>
        typeof f === "string" ? <LinkedFile>{ filename: f } : f
    )

    const filesWithText = files.filter((f) => f.content)
    const filesWithoutText = files.filter((f) => !f.content)
    const increment = 100 / (filesWithText.length + filesWithoutText.length)

    if (filesWithText.length) {
        const { response } = await fetcher.POST("/upsert", {
            body: {
                documents: filesWithText.map(toDocument),
            },
        })
        if (!response.ok)
            console.log(
                `failed to insert files ${response.status} ${response.statusText}`
            )
        progress?.report({ increment: increment * filesWithText.length })
        if (trace)
            for (const f of filesWithText)
                trace.resultItem(response.ok, `index` + f.filename)
    }
    if (filesWithoutText.length) {
        for (const f of filesWithoutText) {
            progress?.report({ increment, message: f.filename })
            const body: any = {
                file: undefined,
                metadata: {
                    id: f.filename,
                    source: undefined,
                    url: undefined,
                },
            }
            if (/^http?s:\/\//i.test(f.filename)) {
                const res = await fetch(f.filename)
                const blob = await res.blob()
                body.file = blob
                body.metadata.url = f.filename
            } else {
                const type = lookup(f.filename) || "text/plain"
                const buffer = await host.readFile(f.filename)
                body.file = new Blob([buffer], {
                    type,
                })
                body.metadata.source = "file"
            }
            if (!SUPPORTED_MIME_TYPES.includes(body.file.type)) {
                trace?.resultItem(false, `${f.filename}, unsupported file type`)
                continue
            }
            const { response } = await fetcher.POST("/upsert-file", {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
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
                console.log(`failed to upsert ${f.filename}`, response)
            trace?.resultItem(response.ok, `index` + f.filename)
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
                filename: metadata?.url || metadata?.document_id,
                id,
                text,
                score,
            })
        ),
    }
}
