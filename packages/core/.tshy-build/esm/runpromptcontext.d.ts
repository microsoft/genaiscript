import { PromptNode } from "./promptdom.js";
import { MarkdownTrace } from "./trace.js";
import { GenerationOptions } from "./generation.js";
import { CancellationToken } from "./cancellation.js";
import { Project } from "./server/messages.js";
import type { ChatGenerationContext, ChatTurnGenerationContext, ExpansionVariables } from "./types.js";
/**
 * Creates a chat turn generation context object for building prompt nodes and utilities in a chat session.
 *
 * @param options - Generation options that configure prompt and model behaviors.
 * @param trace - Trace logger for output and debugging; collects logs and tracing information for the turn.
 * @param cancellationToken - Token used for supporting cancellation of asynchronous operations within this context.
 *
 * @returns Chat turn generation context with a prompt node for composition and methods:
 *   - node: The root prompt node for this chat turn.
 *   - writeText: Adds a text (or assistant/system) message node, with optional configuration.
 *   - assistant: Shortcut for adding a message as assistant.
 *   - $: Tagged template for string templates. Returns a PromptTemplateString for further configuration (setting priority, jinja/mustache transforms, roles, caching, etc.).
 *   - def: Defines a named prompt artifact (text, file, etc.) in the prompt context.
 *   - defImages: Defines image input(s) as prompt nodes, supports tiling and various source types.
 *   - defData: Defines structured data input as a prompt node.
 *   - defDiff: Defines a diff between two items and appends as a prompt node.
 *   - fence: Wraps body in a code fence and defines as a prompt artifact.
 *   - importTemplate: Imports and expands a prompt template.
 *   - console: Logging interface for messages, warnings, errors, and debugging within the context.
 *
 * This context is generally used by higher-level orchestration to build structured prompt data,
 * images, and system messages suitable for multi-turn chat generations.
 */
export declare function createChatTurnGenerationContext(options: GenerationOptions, trace: MarkdownTrace, cancellationToken: CancellationToken): ChatTurnGenerationContext & {
    node: PromptNode;
};
export interface RunPromptContextNode extends ChatGenerationContext {
    node: PromptNode;
}
export declare function createChatGenerationContext(options: GenerationOptions, trace: MarkdownTrace, projectOptions: {
    prj: Project;
    env: ExpansionVariables;
}): RunPromptContextNode;
//# sourceMappingURL=runpromptcontext.d.ts.map