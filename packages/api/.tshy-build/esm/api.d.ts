import type { Awaitable, GenerationResult, PromptScriptRunOptions, Resource } from "@genaiscript/core";
/**
 * Runs a GenAIScript script with the given files and options.
 * This function acts similarly to the `run` command in the CLI.
 * @param scriptId The script identifier or full file path. This parameter is required.
 * @param files List of file paths to run the script on, leave empty if not needed.
 * @param options GenAIScript generation options, including optional environment variables, an abort signal, and additional options. The options may include a label for the worker thread.
 *   - envVars: Environment variables to use for the operation.
 *   - signal: The signal to use for aborting the operation. Terminates the worker thread.
 * @returns A promise that resolves with the generation result or rejects if an error occurs.
 */
export declare function run(
/**
 * The script identifier or full file path.
 */
scriptId: string, 
/**
 * List of file paths to run the script on, leave empty if not needed.
 */
files?: string | string[], 
/**
 * GenAIScript generation options.
 */
options?: Partial<PromptScriptRunOptions> & {
    /**
     * Environment variables to use for the operation.
     */
    envVars?: Record<string, string>;
    /**
     * The signal to use for aborting the operation. Terminates the worker thread.
     */
    signal?: AbortSignal;
    /**
     * Handles messages
     */
    onMessage?: (data: {
        type: "resourceChange";
    } & Resource, postMessage: (data: any) => void) => Awaitable<void>;
    /**
     * Enable client language model as parent.
     */
    parentLanguageModel?: boolean;
}): Promise<GenerationResult>;
//# sourceMappingURL=api.d.ts.map