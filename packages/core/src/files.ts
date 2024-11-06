import { isGlobMatch } from "./glob"
import { arrayify } from "./util"

export function filterFile(file: WorkspaceFile, filter: FileFilterOptions) {
    const { glob } = filter || {}
    const endsWith = arrayify(filter?.endsWith)
    const { filename } = file
    if (glob && filename) {
        if (!isGlobMatch(filename, glob)) return false
    }
    if (endsWith.length && !endsWith.some((ext) => filename.endsWith(ext)))
        return false
    return true
}
