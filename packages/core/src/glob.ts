import { minimatch } from "minimatch"

export function isGlobMatch(filename: string, glob:string) {    
    const match = minimatch(filename, glob, {
        windowsPathsNoEscape: true,
    })
    return match
}
