import { minimatch } from "minimatch"

export function isGlobMatch(filename: string, pattern: string) {
    const match = minimatch(filename, pattern, {
        windowsPathsNoEscape: true,
    })
    return match
}
