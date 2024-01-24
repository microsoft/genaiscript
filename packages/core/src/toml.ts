import { parse } from "toml"

export function TOMLTryParse(text: string) {
    try {
        return parse(text)
    } catch (e) {
        return undefined
    }
}
