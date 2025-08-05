import type { PromptScriptRunOptions } from "@genaiscript/core";
/**
 * Converts a set of files based on a specified script, applying transformations and generating output files.
 *
 * @param scriptId - Identifier of the script to use for file conversion.
 * @param fileGlobs - Array of file paths or glob patterns identifying files to be transformed.
 * @param options - Additional configuration for the conversion process:
 *   - `suffix` - Custom suffix for the output files.
 *   - `rewrite` - If true, overwrites existing files instead of creating new ones with a suffix.
 *   - `cancelWord` - A keyword that cancels processing if found in the result.
 *   - `concurrency` - Number of files to process concurrently.
 *   - `excludedFiles` - Array of file paths or glob patterns to exclude from processing.
 *   - `ignoreGitIgnore` - If true, ignores .gitignore rules during file resolution.
 *   - `runTrace` - If false, disables trace generation for individual files.
 *   - `outputTrace` - If false, disables output trace generation for individual files.
 *   - Other options passed to the transformation process.
 *
 * @throws Error if the script is not found or no files match the given patterns.
 *
 * Resolves files matching the provided patterns, filters them based on exclusion and rewrite options,
 * applies AI transformations using the specified script, and writes results to output files.
 */
export declare function convertFiles(scriptId: string, fileGlobs: string[], options: Partial<PromptScriptRunOptions> & {
    suffix?: string;
    rewrite?: boolean;
    cancelWord?: string;
    concurrency?: string;
}): Promise<void>;
//# sourceMappingURL=convert.d.ts.map