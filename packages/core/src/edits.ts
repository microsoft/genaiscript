import { GenerationResult } from "./expander"
import { writeText } from "./fs"

export async function writeFileEdits(
    res: GenerationResult,
    applyEdits: boolean
) {
    for (const fileEdit of Object.entries(res.fileEdits)) {
        const [fn, { before, after, validation }] = fileEdit
        if (!validation?.valid && !applyEdits) continue
        if (after !== before) await writeText(fn, after ?? before)
    }
}
