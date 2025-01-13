export function deleteEmptyValues<T extends Record<string, any>>(o: T): T {
    if (typeof o === "object")
        for (const k in o) {
            const v = o[k]
            if (
                v === undefined ||
                v === null ||
                v === "" ||
                (Array.isArray(v) && !v.length)
            )
                delete o[k]
        }
    return o
}

export function cleanedClone(o: any) {
    const c = structuredClone(o)
    deleteEmptyValues(c)
    return c
}
