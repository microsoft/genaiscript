import { parse } from "toml"

export function TOMLTryParse(text: string, options?: { defaultValue?: any }) {
    try {
        const res = parse(text)
        return res
    } catch (e) {
        return options?.defaultValue
    }
}
