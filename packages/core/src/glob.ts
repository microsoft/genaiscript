// Import the 'minimatch' library for matching file paths against glob patterns
import { minimatch } from "minimatch"

// Import the 'arrayify' utility function from the local 'util' module
import { arrayify } from "./util"

/**
 * Checks if a given filename matches any of the provided glob patterns.
 *
 * @param filename - The name of the file to test against the patterns.
 * @param patterns - A single glob pattern or an array of glob patterns to match against.
 * @returns A boolean indicating if the filename matches any of the patterns.
 */
export function isGlobMatch(filename: string, patterns: string | string[]) {
    // Convert patterns to an array and check if any pattern matches the filename
    return arrayify(patterns).some((pattern) => {
        // Perform the match using minimatch with specific options
        const match = minimatch(filename, pattern, {
            // Option to handle Windows paths correctly by preventing escape character issues
            windowsPathsNoEscape: true,
        })
        return match // Return true if a match is found
    })
}
