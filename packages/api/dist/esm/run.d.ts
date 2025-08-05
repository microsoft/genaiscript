import type { CancellationOptions, ChatCompletionsProgressReport, GenerationResult, PromptScriptRunOptions, TraceOptions } from "@genaiscript/core";
import { MarkdownTrace } from "@genaiscript/core";
/**
 * Executes a script internally with supplied options and handles outputs.
 *
 * @param scriptId - The identifier of the script to be executed.
 * @param files - Array of file paths or URLs to be processed by the script.
 * @param options - Configuration object including additional execution parameters:
 *   - runId: Optional identifier for the execution run.
 *   - runOutputTrace: Instance for capturing output trace events.
 *   - cli: Indicates if CLI mode is active.
 *   - infoCb: Callback function for informational messages.
 *   - partialCb: Callback for reporting partial progress in chat completions.
 *   - cancellationToken: Token for handling cancellation requests.
 *   - runTrace: Enables/disables trace file writing.
 *   - json/yaml: Toggles structured output formats.
 *   - vars: Variables to pass to the script.
 *   - reasoningEffort: Specifies reasoning intensity for model execution.
 *   - annotations/changelogs/data/output options: Configs for exporting diagnostics, changes, intermediate data, and results.
 *   - pullRequestComments, descriptions, or reviews: Enables integration with GitHub or Azure DevOps for updates.
 *   - applyEdits: Indicates if file edits should be applied.
 *   - retry/retryDelay/maxDelay: Configurations for retry logic.
 *   - cache: Cache name or configuration.
 *   - csvSeparator: Separator for CSV outputs.
 *   - removeOut: Indicates if the output directory should be cleared before execution.
 *   - jsSource: JavaScript source code for the script.
 *   - logprobs/topLogprobs: Configurations for log probability outputs.
 *   - fenceFormat: Specifies the format for fenced code blocks.
 *   - workspaceFiles: Additional files to include in the workspace.
 *   - excludedFiles: Files to exclude from processing.
 *   - ignoreGitIgnore: Disables applying .gitignore rules when resolving files.
 *   - label: Optional label for the execution run.
 *   - temperature: Sampling temperature for model execution.
 *   - fallbackTools: Fallback tools to use if primary tools fail.
 *   - topP: Top-p sampling parameter for model execution.
 *   - toolChoice: Specifies the tool to use for execution.
 *   - seed: Random seed for reproducibility.
 *   - maxTokens: Maximum number of tokens for model responses.
 *   - maxToolCalls: Maximum number of tool calls allowed.
 *   - maxDataRepairs: Maximum number of data repair attempts.
 *   - accept: Specifies file extensions to accept for processing.
 *   - failOnErrors: Indicates if the script should fail on errors.
 *   - outTrace: Path to write trace output.
 *   - outOutput: Path to write output trace.
 *   - outAnnotations: Path to write annotations.
 *   - outChangelogs: Path to write changelogs.
 *   - outData: Path to write intermediate data.
 *   - pullRequest: Pull request ID for integration.
 *   - pullRequestComment: Enables adding comments to pull requests.
 *   - pullRequestDescription: Enables updating pull request descriptions.
 *   - pullRequestReviews: Enables adding reviews to pull requests.
 *   - teamsMessage: Enables sending messages to Microsoft Teams.
 *
 * @returns A Promise resolving to an object containing:
 *   - exitCode: Final exit code of the script execution.
 *   - result: Generation result object from script processing.
 */
export declare function runScriptInternal(scriptId: string, files: string[], options: Partial<PromptScriptRunOptions> & TraceOptions & CancellationOptions & {
    runId?: string;
    runOutputTrace?: MarkdownTrace;
    cli?: boolean;
    infoCb?: (partialResponse: {
        text: string;
    }) => void;
    partialCb?: (progress: ChatCompletionsProgressReport) => void;
}): Promise<{
    exitCode: number;
    result?: GenerationResult;
}>;
//# sourceMappingURL=run.d.ts.map