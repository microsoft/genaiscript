import { parse } from "toml"
import { unfence } from "./fence"

export function TOMLTryParse(text: string, options?: { defaultValue?: any }) {
    try {
        const cleaned = unfence(text, "toml")
        const res = parse(cleaned)
        return res
    } catch (e) {
        return options?.defaultValue
    }
}
