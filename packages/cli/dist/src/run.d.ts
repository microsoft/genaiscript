import type { PromptScriptRunOptions, TraceOptions } from "@genaiscript/core";
/**
 * Executes a script with a possible retry mechanism and exits the process with the appropriate code.
 * Ensures necessary setup, handles retries on failure or cancellation, and supports CLI mode.
 *
 * @param scriptId - The identifier of the script to execute.
 * @param files - A list of file paths to use as input for the script.
 * @param options - Configuration options for running the script. Includes retry parameters, trace configuration, cancellation token, and other execution-related settings.
 *
 * Exits with a success code if the script completes successfully, or with an appropriate error code if it fails, is cancelled, or encounters an unrecoverable error.
 */
export declare function runScriptWithExitCode(scriptId: string, files: string[], options: Partial<PromptScriptRunOptions> & TraceOptions): Promise<void>;
//# sourceMappingURL=run.d.ts.map