import { lookup as mimeTypesLookup } from "mime-types"

export const TYPESCRIPT_MIME_TYPE = "text/x-typescript"
export const CSHARP_MIME_TYPE = "text/x-csharp"
export const PYTHON_MIME_TYPE = "text/x-python"

export function lookupMime(filename: string) {
    if (!filename) return ""
    if (/\.ts$/i.test(filename)) return TYPESCRIPT_MIME_TYPE
    if (/\.cs$/i.test(filename)) return CSHARP_MIME_TYPE
    if (/\.py$/i.test(filename)) return PYTHON_MIME_TYPE
    return mimeTypesLookup(filename) || ""
}
