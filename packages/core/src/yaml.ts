import { parse } from "yaml"

export function YAMLTryParse<T = any>(text: string, defaultValue?: T): T {
    try {
        return parse(text)
    } catch (e) {
        return defaultValue
    }
}

export function YAMLStringify(obj: any): string {
    return JSON.stringify(obj, undefined, 2)
}
