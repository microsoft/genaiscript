/* eslint-disable curly */
import { parse, stringify } from "json5"
import { jsonrepair } from "jsonrepair"

export function isJSONObjectOrArray(text: string) {
    return /^\s*[\{\[]/.test(text)
}

export function JSONrepair(text: string) {
    const repaired = jsonrepair(text)
    return repaired
}

export function JSON5parse<T = unknown>(
    text: string,
    options?: {
        defaultValue?: T
        errorAsDefaultValue?: boolean
        repair?: boolean
    }
): T | undefined | null {
    try {
        if (options?.repair) {
            try {
                const res = parse(text)
                return res as T
            } catch {
                const repaired = JSONrepair(text)
                const res = parse(repaired)
                return (res as T) ?? options?.defaultValue
            }
        } else {
            const res = parse(text)
            return res as T
        }
    } catch (e) {
        if (options?.errorAsDefaultValue) return options?.defaultValue
        throw e
    }
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export function JSON5TryParse<T = unknown>(
    text: string | undefined | null,
    defaultValue?: T
): T | undefined | null {
    if (text === undefined) return undefined
    if (text === null) return null
    return JSON5parse<T>(text, {
        defaultValue,
        errorAsDefaultValue: true,
        repair: true,
    })
}

const startRx = /^\s*\`\`\`json\s/
const endRx = /\`\`\`\s*$/
export function JSONLLMTryParse(s: string): any {
    if (s === undefined || s === null) return s
    if (startRx.test(s) && endRx.test(s))
        s = s.replace(startRx, "").replace(endRx, "")
    return JSON5TryParse(s)
}

export const JSON5Stringify = stringify
