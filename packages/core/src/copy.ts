// This file defines functions related to copying and managing prompt scripts,
// including constructing file paths and handling copy operations,
// with optional forking functionality.

import { PromptScript } from "./ast" // Import PromptScript type
import { GENAI_MJS_EXT, GENAI_SRC } from "./constants" // Import constants for file extensions and source directory
import { host } from "./host" // Import host module for file operations
import { fileExists, writeText } from "./fs" // Import file system utilities

/**
 * Constructs the path to a prompt file.
 * If `id` is null, returns the base prompt directory path.
 * Otherwise, appends the `id` with a specific file extension to the path.
 *
 * @param id - Identifier for the prompt script
 * @returns The file path as a string
 */
function promptPath(id: string) {
    const prompts = host.resolvePath(host.projectFolder(), GENAI_SRC) // Resolve base prompt directory
    if (id === null) return prompts // Return base path if id is not provided
    return host.resolvePath(prompts, id + GENAI_MJS_EXT) // Construct full path if id is provided
}

/**
 * Copies a prompt script to a new location.
 * Can optionally fork the script if needed, ensuring that the new filename is unique.
 *
 * @param t - The prompt script object
 * @param options - Configuration options for the copy
 * @param options.fork - Indicates if the script should be forked
 * @param options.name - Optional new name for the copied script
 * @returns The file path of the copied script
 * @throws If the file already exists in the target location
 */
export async function copyPrompt(
    t: PromptScript,
    options: { fork: boolean; name?: string }
) {
    // Ensure the prompt directory exists
    await host.createDirectory(promptPath(null))

    // Determine the name for the new prompt file
    const n = options?.name || t.id // Use provided name or default to script id
    let fn = promptPath(n)

    // Handle forking logic by appending a suffix if needed
    if (options.fork) {
        let suff = 2
        for (;;) {
            fn = promptPath(n + "_" + suff) // Construct new name with suffix
            if (await fileExists(fn)) {
                // Check if file already exists
                suff++
                continue // Increment suffix and retry if file exists
            }
            break // Exit loop if file does not exist
        }
    }

    // Check if the file already exists, throw error if it does
    if (await fileExists(fn)) throw new Error(`file ${fn} already exists`)

    // Write the prompt script to the determined path
    await writeText(fn, t.jsSource)

    return fn // Return the path of the copied script
}
