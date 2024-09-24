import { minimatch } from "minimatch"
import { arrayify } from "./util"

export function isGlobMatch(filename: string, patterns: string | string[]) {
    return arrayify(patterns).some((pattern) => {
        const match = minimatch(filename, pattern, {
            windowsPathsNoEscape: true,
        })
        return match
    })
}
