import { RetreivalClientOptions, host } from "./host"
import { lookup } from "mime-types"

const UPSERTFILE_MIME_TYPES = [
    "text/plain",
    "text/markdown",
    "text/csv",
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]

export function retreivalIsIndexable(filename: string) {
    const type = lookup(filename) || "text/plain"
    return UPSERTFILE_MIME_TYPES.includes(type)
}

export async function retreivalClear(): Promise<void> {
    await host.retreival.clear()
}

export async function retreivalUpsert(
    fileOrUrls: (string | LinkedFile)[],
    options?: RetreivalClientOptions
) {
    if (!fileOrUrls?.length) return
    const { progress, trace } = options || {}
    const retreival = host.retreival

    const files: LinkedFile[] = fileOrUrls.map((f) =>
        typeof f === "string" ? <LinkedFile>{ filename: f } : f
    )
    const increment = 100 / files.length
    for (const f of files) {
        let file: Blob = undefined
        if (f.content) {
            file = new Blob([f.content], {
                type: lookup(f.filename) || "text/plain",
            })
        } else if (/^http?s:\/\//i.test(f.filename)) {
            const res = await fetch(f.filename)
            const blob = await res.blob()
            file = blob
        } else {
            const type = lookup(f.filename) || "text/plain"
            const buffer = await host.readFile(f.filename)
            file = new Blob([buffer], {
                type,
            })
        }
        if (!UPSERTFILE_MIME_TYPES.includes(file.type)) {
            trace?.resultItem(false, `${f.filename}, unsupported file type`)
            continue
        }
        const { ok } = await retreival.upsert(f.filename, file)
        progress?.report({
            increment,
            message: f.filename,
            succeeded: ok,
        })
        trace?.resultItem(ok, f.filename)
    }
}

export async function retreivalSearch(
    q: string,
    options?: RetreivalClientOptions
) {
    const retreival = host.retreival
    const { results } = await retreival.search(q)
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
