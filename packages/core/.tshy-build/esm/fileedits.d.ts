import { TraceOptions } from "./trace.js";
import type { FileMergeHandler, FileOutput, FileUpdate, JSONSchema, PromptOutputProcessorHandler, RunPromptResult } from "./types.js";
/**
 * Computes file edits based on the specified runtime prompt result and processing options.
 *
 * @param res The result of the runtime prompt execution, containing text, annotations, fences, frames, and messages.
 * @param options Configuration options for processing the result:
 *   - trace: A trace object for logging details of the computation.
 *   - fileOutputs: A list of file output rules applied to edited files.
 *   - schemas: JSON schemas for validation of file outputs and content.
 *   - fileMerges: Handlers for custom merging of file content.
 *   - outputProcessors: Handlers for post-processing generated content and files.
 *
 * Performs the following operations:
 * - Processes fenced code blocks in the result to determine edits (file or diff).
 * - Applies changes to files based on their type:
 *   - Direct file updates.
 *   - Diff-based patches or merges.
 * - Processes changelogs to update relevant files.
 * - Executes custom output processors if specified.
 * - Validates file outputs against specified schemas or patterns.
 * - Generates structured edits for tracked file changes.
 * - Updates the result structure with computed edits, changelogs, annotations, and file modifications.
 * - Logs details of the computation process, including errors and skipped files.
 */
export declare function computeFileEdits(res: RunPromptResult, options: TraceOptions & {
    fileOutputs: FileOutput[];
    schemas?: Record<string, JSONSchema>;
    fileMerges?: FileMergeHandler[];
    outputProcessors?: PromptOutputProcessorHandler[];
}): Promise<void>;
/**
 * Asynchronously writes file edits to disk.
 *
 * @param fileEdits - A record of file updates, including filename, original content, updated content, and validation details. Skips files with invalid schemas unless applyEdits is true.
 * @param options - Options for applying edits and tracing details:
 *   - applyEdits: If true, applies edits even if validation fails.
 *   - trace: A trace object for logging details, including skipped files, changes, and diff information.
 */
export declare function writeFileEdits(fileEdits: Record<string, FileUpdate>, // Contains the edits to be applied to files
options?: {
    applyEdits?: boolean;
} & TraceOptions): Promise<void>;
//# sourceMappingURL=fileedits.d.ts.map