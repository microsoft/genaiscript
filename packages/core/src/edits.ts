import { FragmentTransformResponse } from "./expander"
import { writeText } from "./fs"

export async function writeFileEdits(res: FragmentTransformResponse) {
    if (res?.fileEdits)
        for (const fileEdit of Object.entries(res.fileEdits)) {
            const [fn, { before, after }] = fileEdit
            if (after !== before) await writeText(fn, after ?? before)
        }
}
