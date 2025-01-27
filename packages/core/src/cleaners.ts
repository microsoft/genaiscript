export function deleteUndefinedValues<T extends Record<string, any>>(o: T): T {
    if (typeof o === "object")
        for (const k in o) if (o[k] === undefined) delete o[k]
    return o
}

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


export function normalizeString(s: string | number | boolean | object): string {
    if (typeof s === "string") return s
    else if (typeof s === "number") return s.toLocaleString()
    else if (typeof s === "boolean") return s ? "true" : "false"
    else if (typeof s === "object") return JSON.stringify(s)
    else return undefined
}

export function normalizeFloat(s: string | number | boolean | object): number {
    if (typeof s === "string") {
        const f = parseFloat(s)
        return isNaN(f) ? undefined : f
    } else if (typeof s === "number") return s
    else if (typeof s === "boolean") return s ? 1 : 0
    else if (typeof s === "object") return 0
    else return undefined
}

export function normalizeInt(s: string | number | boolean | object): number {
    if (typeof s === "string") {
        const f = parseInt(s)
        return isNaN(f) ? undefined : f
    } else if (typeof s === "number") return s
    else if (typeof s === "boolean") return s ? 1 : 0
    else if (typeof s === "object") return 0
    else return undefined
}

export function trimTrailingSlash(s: string) {
    return s?.replace(/\/{1,10}$/, "")
}

export function normalizeVarKey(key: string) {
    return key.toLowerCase().replace(/[^a-z0-9\.]/g, "")
}
