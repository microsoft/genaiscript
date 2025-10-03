/**
 * This module provides CLI functionality for processing GitHub Actions workflow files
 */

import { readFile, writeFile } from "fs/promises"
import { processGitHubWorkflow } from "../../core/src/githubworkflow"
import { logInfo, logVerbose } from "../../core/src/util"

/**
 * Processes GitHub Actions workflow files to transform the "names" field
 * under labeled/unlabeled triggers into conditional expressions.
 *
 * @param files - Array of workflow file paths to process
 * @param options - Processing options
 * @param options.dryRun - If true, show what would be changed without writing files
 * @param options.verbose - If true, show detailed output
 */
export async function processWorkflowFiles(
    files: string[],
    options?: { dryRun?: boolean; verbose?: boolean }
): Promise<void> {
    const { dryRun, verbose } = options || {}

    for (const file of files) {
        try {
            logInfo(`Processing ${file}...`)
            
            // Read the workflow file
            const content = await readFile(file, "utf-8")
            
            // Process the workflow
            const processed = processGitHubWorkflow(content)
            
            // Check if there were changes
            if (content === processed) {
                logInfo(`  No changes needed`)
                continue
            }
            
            if (dryRun) {
                logInfo(`  Would update (dry run)`)
                if (verbose) {
                    logVerbose("Original:")
                    logVerbose(content)
                    logVerbose("\nProcessed:")
                    logVerbose(processed)
                }
            } else {
                // Write the processed workflow back
                await writeFile(file, processed, "utf-8")
                logInfo(`  Updated successfully`)
                if (verbose) {
                    logVerbose("Processed content:")
                    logVerbose(processed)
                }
            }
        } catch (error) {
            console.error(`Error processing ${file}:`, error)
            throw error
        }
    }
}
