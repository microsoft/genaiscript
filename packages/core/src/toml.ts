import { parse } from "toml"

export function TOMLTryParse(text: string, options?: { defaultValue?: any }) {
    try {
        return parse(text)
    } catch (e) {
        return options?.defaultValue
    }
}
