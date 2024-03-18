/* eslint-disable curly */
import { parse } from "json5"

export function JSON5parse<T = unknown>(
    text: string,
    options?: { defaultValue?: T; errorAsDefaultValue?: boolean }
): T | undefined | null {
    try {
        const res = parse(text)
        return res as T
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
    return JSON5parse<T>(text, { defaultValue, errorAsDefaultValue: true })
}
