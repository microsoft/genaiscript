// This module provides functionality to write file edits to disk,
// supporting conditional application of edits based on validation results.

import { GenerationResult } from "./generation" // Import type for generation results
import { writeText } from "./fs" // Import function to write text to files
import { logVerbose } from "./util" // Import function for verbose logging

/**
 * Asynchronously writes file edits to disk.
 *
 * @param res - The result of a generation process containing file edits.
 * @param applyEdits - A flag indicating whether edits should be applied even if validation fails.
 */
export async function writeFileEdits(
    res: GenerationResult, // Contains the edits to be applied to files
    applyEdits: boolean // Determines whether to apply edits unconditionally
) {
    // Iterate over each file edit entry
    for (const fileEdit of Object.entries(res.fileEdits)) {
        // Destructure the filename, before content, after content, and validation from the entry
        const [fn, { before, after, validation }] = fileEdit

        // Skip writing if the edit is invalid and applyEdits is false
        if (!validation?.valid && !applyEdits) continue

        // Check if there's a change between before and after content
        if (after !== before) {
            // Log whether the file is being updated or created
            logVerbose(
                `${before !== undefined ? `updating` : `creating`} ${fn}`
            )

            // Write the new content to the file
            await writeText(fn, after ?? before) // Write 'after' content if available, otherwise 'before'
        }
    }
}
