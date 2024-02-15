import { RetreivalClientOptions, RetreivalQueryOptions, host } from "./host"
import { lookup } from "mime-types"

const UPSERTFILE_MIME_TYPES = [
    "text/plain",
    "text/markdown",
    "text/csv",
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]

export function isIndexable(filename: string) {
    const type = lookup(filename) || "text/plain"
    return UPSERTFILE_MIME_TYPES.includes(type)
}

export async function clearIndex(
    options?: RetreivalClientOptions
): Promise<void> {
    const { trace } = options || {}
    await host.retreival.init(trace)
    await host.retreival.clear()
}

export async function upsert(
    fileOrUrls: (string | LinkedFile)[],
    options?: RetreivalClientOptions
) {
    if (!fileOrUrls?.length) return
    const { progress, trace } = options || {}
    const retreival = host.retreival
    await retreival.init(trace)
    const files: LinkedFile[] = fileOrUrls.map((f) =>
        typeof f === "string" ? <LinkedFile>{ filename: f } : f
    )
    const increment = 100 / files.length
    for (const f of files) {
        const { ok } = await retreival.upsert(f.filename, f.content)
        progress?.report({
            increment,
            message: f.filename,
            succeeded: ok,
        })
        trace?.resultItem(ok, f.filename)
    }
}

export async function query(
    q: string,
    options?: RetreivalClientOptions & RetreivalQueryOptions
) {
    const { trace, ...rest } = options || {}
    const retreival = host.retreival
    await host.retreival.init(trace)

    const res = await retreival.query(q, rest)
    return res?.response || ""
}

export interface RetreivalSearchResult {
    files: LinkedFile[]
    fragments: LinkedFile[]
}

export async function search(
    q: string,
    options?: RetreivalClientOptions & RetreivalQueryOptions
): Promise<RetreivalSearchResult> {
    const { trace, ...rest } = options || {}
    const retreival = host.retreival
    await host.retreival.init(trace)

    const { results } = await retreival.search(q, rest)
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
        if (!file) {
            file = <LinkedFile>{
                filename: fr.filename,
                label: `fragments`,
                content: "...\n",
            }
            files.push(file)
        }
        file.content += fr.content + `\n...`
    }
    return {
        files,
        fragments,
    }
}
