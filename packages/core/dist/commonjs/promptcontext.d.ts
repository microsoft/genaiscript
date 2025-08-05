import { type RunPromptContextNode } from "./runpromptcontext.js";
import type { GenerationOptions } from "./generation.js";
import type { Project } from "./server/messages.js";
import type { ExpansionVariables, PromptContext } from "./types.js";
/**
 * Creates a prompt context for the specified project, variables, trace, options, and model.
 *
 * @param prj The project for which the context is created.
 * @param ev Expansion variables including generator, output, debugging, run directory, and other configurations.
 * @param trace Markdown trace for logging and debugging.
 * @param options Generation options such as cancellation tokens, embeddings models, and content safety.
 * @param model The model identifier used for context creation.
 * @returns A context object providing methods for file operations, web retrieval, searches, execution, container operations, caching, and other utilities. Includes workspace file system operations (read/write files, grep, find files), retrieval methods (web search, fuzzy search, vector search, index creation), and host operations (command execution, browsing, container management, resource publishing, server management, etc.).
 */
export declare function createPromptContext(prj: Project, ev: ExpansionVariables, options: GenerationOptions, model: string): Promise<PromptContext & RunPromptContextNode>;
//# sourceMappingURL=promptcontext.d.ts.map