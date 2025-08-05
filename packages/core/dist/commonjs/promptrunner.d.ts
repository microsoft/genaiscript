import type { Project } from "./server/messages.js";
import type { Fragment, GenerationOptions } from "./generation.js";
import type { GenerationResult } from "./server/messages.js";
import type { PromptScript } from "./types.js";
/**
 * Executes a prompt template with specified options.
 *
 * @param prj The project context providing runtime and configuration.
 * @param template The prompt script template to execute.
 * @param fragment Additional context such as files, workspace files, and metadata.
 * @param options Configuration for generation, including model, trace, output trace, cancellation token, stats, and other generation parameters.
 * @returns A generation result containing execution details, outputs, and potential errors, including status, messages, edits, annotations, file changes, and usage statistics.
 */
export declare function runTemplate(prj: Project, template: PromptScript, fragment: Fragment, options: GenerationOptions): Promise<GenerationResult>;
//# sourceMappingURL=promptrunner.d.ts.map