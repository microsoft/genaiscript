import { parse, stringify } from "yaml"

export function YAMLTryParse<T = any>(
    text: string,
    defaultValue?: T,
    options?: { ignoreLiterals?: boolean }
): T {
    const { ignoreLiterals } = options || {}
    try {
        const res = parse(text)
        if (
            ignoreLiterals &&
            ["number", "boolean", "string"].includes(typeof res)
        )
            return defaultValue
        return res
    } catch (e) {
        return defaultValue
    }
}

export function YAMLStringify(obj: any): string {
    return stringify(obj, undefined, 2)
}
