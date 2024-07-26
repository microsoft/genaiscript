import { GenerationResult } from "./generation"
import { writeText } from "./fs"
import { logVerbose } from "./util"

export async function writeFileEdits(
    res: GenerationResult,
    applyEdits: boolean
) {
    for (const fileEdit of Object.entries(res.fileEdits)) {
        const [fn, { before, after, validation }] = fileEdit
        if (!validation?.valid && !applyEdits) continue
        if (after !== before) {
            logVerbose(
                `${before !== undefined ? `updating` : `creating`} ${fn}`
            )
            await writeText(fn, after ?? before)
        }
    }
}
