import { logVerbose } from "./util"

export function estimateTokens(text: string, encoder: TokenEncoder) {
    if (!text?.length) return 0
    try {
        return encoder(text).length
    } catch (e) {
        logVerbose(e)
        return text.length >> 2
    }
}
