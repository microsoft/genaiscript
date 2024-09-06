import { ESTIMATE_TOKEN_OVERHEAD } from "./constants"
import { logVerbose } from "./util"

export function estimateTokens(text: string, encoder: TokenEncoder) {
    if (!text?.length) return 0
    try {
        return encoder(text).length + ESTIMATE_TOKEN_OVERHEAD
    } catch (e) {
        logVerbose(e)
        return (text.length >> 2) + ESTIMATE_TOKEN_OVERHEAD
    }
}
