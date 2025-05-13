export function metadataValidate(
    metadata: Record<string, string>
): Record<string, string> | undefined {
    if (!metadata) return undefined
    const entries = Object.entries(metadata)
    if (entries.length > 16)
        throw new Error("Metadata can only have 16 entries")
    for (const [key, value] of entries) {
        if (typeof key !== "string" || key.length > 64)
            throw new Error("Invalid metadata key")
        if (typeof value !== "string" || value.length > 512)
            throw new Error("Invalid metadata value")
    }
    return metadata
}

export function metadataMerge(
    source: Record<string, string> | undefined,
    update: Record<string, string> | undefined
): Record<string, string> | undefined {
    if (!source) return update
    if (!update) return source
    const res = {
        ...(source || {}),
        ...(update || {}),
    }
    return metadataValidate(res)
}
