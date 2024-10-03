export function llmifyId(id: number, prefix: string): string {
    return `${prefix}_${id}`
}

export function unllmifyIntId(llmid: string | number, prefix: string): number {
    if (typeof llmid === "number") return llmid
    const sid = llmid as string
    const { p, id } = /^(?<p>\w+)_(?<id>.*)$/.exec(sid)?.groups || {}
    const i = parseInt(id)
    return prefix === p && !isNaN(i) ? i : parseInt(llmid)
}

export function unllmifyId(
    llmid: string | number,
    prefix: string
): number | string {
    if (typeof llmid === "number") return llmid
    const sid = llmid as string
    const { p, id } = /^(?<p>\w+)_(?<id>.*)$/.exec(sid)?.groups || {}
    const i = parseInt(id)
    return prefix === p && !isNaN(i) ? i : llmid
}
