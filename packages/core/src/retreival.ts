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

const UPSERTFILE_MIME_TYPES = [
    "text/plain",
    "text/markdown",
    "text/csv",
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]

const UPSERT_MIME_TYPES = ["text/plain", "text/markdown", "text/csv"]

export function isIndexable(filename: string) {
    const type = lookup(filename) || "text/plain"
    return UPSERTFILE_MIME_TYPES.includes(type)
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

    const filesWithText = files.filter(
        (f) =>
            f.content &&
            UPSERT_MIME_TYPES.includes(lookup(f.filename) || "text/plain")
    )
    const filesWithoutText = files.filter((f) => !filesWithText.includes(f))
    const increment = 100 / files.length

    if (filesWithText.length) {
        const { response, data } = await fetcher.POST("/upsert", {
            body: {
                documents: filesWithText.map(toDocument),
            },
        })
        progress?.report({
            increment: increment * filesWithText.length,
            succeeded: response.ok,
        })
        if (trace)
            for (let i = 0; i < filesWithText.length; i++) {
                const f = filesWithText[i]
                trace.resultItem(
                    response.ok,
                    `indexed ${f.filename} -> ${data?.ids?.[i] || ""}`
                )
            }
    }
    if (filesWithoutText.length) {
        for (const f of filesWithoutText) {
            let file: Blob = undefined
            let metadata: any = {
                source: undefined,
                url: undefined,
            }
            if (/^http?s:\/\//i.test(f.filename)) {
                const res = await fetch(f.filename)
                const blob = await res.blob()
                file = blob
                metadata.url = f.filename
            } else {
                const type = lookup(f.filename) || "text/plain"
                const buffer = await host.readFile(f.filename)
                file = new Blob([buffer], {
                    type,
                })
                metadata.source = "file"
            }
            if (!UPSERTFILE_MIME_TYPES.includes(file.type)) {
                trace?.resultItem(false, `${f.filename}, unsupported file type`)
                continue
            }
            const { response, data } = await fetcher.POST("/upsert-file", {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
                body: {
                    id: f.filename,
                    file: file as any as string,
                    metadata: JSON.stringify(metadata),
                },
                bodySerializer(body) {
                    const fd = new FormData()
                    for (const [k, v] of Object.entries(body)) {
                        fd.append(k, v)
                    }
                    return fd
                },
            })
            progress?.report({
                increment,
                message: f.filename,
                succeeded: response.ok,
            })
            trace?.resultItem(response.ok, f.filename)
        }
    }
}

export async function query(
    q: string,
    options?: RetreivalClientOptions & { filename?: string }
) {
    const { filename, trace } = options || {}
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

    const results = res.data?.results?.[0]?.results?.map(
        ({ id, text, score, metadata }) => ({
            filename: metadata?.url || metadata?.document_id,
            id,
            text,
            score,
        })
    )
    const fragments = (results || []).map((r) => {
        const { id, filename, text } = r
        return <LinkedFile>{
            filename,
            content: text,
            label: id,
        }
    })
    const files: LinkedFile[] = []
    for (const fr of fragments) {
        let file = files.find((f) => f.filename === fr.filename)
        if (!file)
            file = <LinkedFile>{
                filename: fr.filename,
                label: `fragments`,
                content: "...\n",
            }
        file.content += fr.content + `\n...`
    }
    return {
        files,
        fragments,
    }
}
