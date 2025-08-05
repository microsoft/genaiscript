import { type PromptImage, type PromptPrediction } from "./promptdom.js";
import type { GenerationOptions } from "./generation.js";
import type { ChatCompletionMessageParam } from "./chattypes.js";
import type { GenerationStatus, Project } from "./server/messages.js";
import type { ChatParticipant, ExpansionVariables, FileMergeHandler, FileOutput, JSONSchema, PromptOutputProcessorHandler, PromptScript, ToolCallback } from "./types.js";
/**
 * Executes a prompt expansion process based on the provided prompt script, variables, and options.
 *
 * @param prj - The project instance in which the prompt script is executed.
 * @param r - The prompt script to be evaluated, containing the logic and structure of the prompt.
 * @param ev - Expansion variables to customize the prompt script evaluation.
 * @param trace - The trace object used for generating logs and debugging details.
 * @param options - Configuration options that influence the prompt expansion and evaluation.
 * @param installGlobally - Specifies whether the prompt context should be installed globally.
 * @returns An object containing the status of the operation, generated messages, images, schema definitions, tools, logs, and other related outputs.
 */
export declare function callExpander(prj: Project, r: PromptScript, ev: ExpansionVariables, options: GenerationOptions, installGlobally: boolean): Promise<Readonly<{
    logs: string;
    status: GenerationStatus;
    statusText: string;
    messages: ChatCompletionMessageParam[];
    images: PromptImage[];
    schemas: Record<string, JSONSchema>;
    functions: readonly ToolCallback[];
    fileMerges: FileMergeHandler[];
    outputProcessors: PromptOutputProcessorHandler[];
    chatParticipants: ChatParticipant[];
    fileOutputs: FileOutput[];
    disposables: AsyncDisposable[];
    prediction: PromptPrediction;
}>>;
/**
 * /**
 *  * Expands a template into a structured prompt to be used for generation.
 *  *
 *  * @param prj The project context for resolution of scripts and systems.
 *  * @param template The template script to be expanded.
 *  * @param options Configuration options for template expansion and generation.
 *  * @param env The environment variables and metadata for the template expansion process.
 *  * @returns An object containing the expanded prompt details, including messages, images, schemas, tools, and more.
 *  *
 *  * Parameters:
 *  * @param prj
 *  * - The current project instance, used to resolve associated systems and scripts.
 *  *
 *  * @param template
 *  * - The source template script containing configurations and definitions for prompt generation.
 *  *
 *  * @param  - has parameters/options i
 */
export declare function expandTemplate(prj: Project, template: PromptScript, options: GenerationOptions, env: ExpansionVariables): Promise<{
    status: string;
    statusText: string;
    messages: ChatCompletionMessageParam[];
    cache?: undefined;
    images?: undefined;
    schemas?: undefined;
    tools?: undefined;
    model?: undefined;
    temperature?: undefined;
    reasoningEffort?: undefined;
    topP?: undefined;
    maxTokens?: undefined;
    maxToolCalls?: undefined;
    seed?: undefined;
    responseType?: undefined;
    responseSchema?: undefined;
    fileMerges?: undefined;
    prediction?: undefined;
    outputProcessors?: undefined;
    chatParticipants?: undefined;
    fileOutputs?: undefined;
    logprobs?: undefined;
    topLogprobs?: undefined;
    disposables?: undefined;
    metadata?: undefined;
    fallbackTools?: undefined;
    disableChatPreview?: undefined;
} | {
    cache: string | boolean;
    messages: ChatCompletionMessageParam[];
    images: PromptImage[];
    schemas: Record<string, JSONSchema>;
    tools: ToolCallback[];
    status: GenerationStatus;
    statusText: string;
    model: import("./types.js").ModelType;
    temperature: number;
    reasoningEffort: import("openai/resources/shared.js").ReasoningEffort;
    topP: number;
    maxTokens: number;
    maxToolCalls: number;
    seed: number;
    responseType: import("./types.js").PromptTemplateResponseType;
    responseSchema: import("./types.js").JSONSchemaObject;
    fileMerges: FileMergeHandler[];
    prediction: PromptPrediction;
    outputProcessors: PromptOutputProcessorHandler[];
    chatParticipants: ChatParticipant[];
    fileOutputs: FileOutput[];
    logprobs: boolean;
    topLogprobs: number;
    disposables: AsyncDisposable[];
    metadata: Record<string, string>;
    fallbackTools: boolean;
    disableChatPreview: boolean;
}>;
//# sourceMappingURL=expander.d.ts.map