import type { ChatCompletionAssistantMessageParam, ChatCompletionMessageParam, ChatCompletionSystemMessageParam, ChatCompletionTool, ChatCompletionToolMessageParam, ChatCompletionUserMessageParam } from "./chattypes.js";
import type { JSONSchema, PromptParametersSchema, PromptTemplateResponseType, ShellOutput } from "./types.js";
import { CancellationOptions } from "./cancellation.js";
export interface ChatRenderOptions extends CancellationOptions {
    textLang?: "markdown" | "text" | "json" | "raw";
    system?: boolean;
    user?: boolean;
    assistant?: boolean;
    cacheImage?: (url: string) => Promise<string>;
    tools?: ChatCompletionTool[];
}
/**
 * Formats the output of a shell command into a readable string.
 * @param output - The shell execution result containing exitCode, stdout, and stderr.
 * @returns A formatted string summarizing the shell output. Includes exit code if non-zero, stdout formatted as text, and stderr formatted as text, separated by double newlines. Returns stdout directly if the exit code is zero.
 */
export declare function renderShellOutput(output: ShellOutput): string;
/**
 * Renders the content of a message into a formatted string.
 *
 * @param msg - The message object containing content, which may include text, images, audio, or other types.
 *              Supports both string and array-based content. Unknown types are rendered as "unknown message".
 * @param options - Optional configuration for rendering, including text formatting, image caching, and language.
 *                  Supports a function for caching images and defaults to markdown formatting if not specified.
 *                  If textLang is "raw", returns raw content without formatting.
 * @returns A formatted string representation of the message content, or undefined if the content is invalid or unsupported.
 */
export declare function renderMessageContent(msg: ChatCompletionAssistantMessageParam | ChatCompletionSystemMessageParam | ChatCompletionUserMessageParam | ChatCompletionToolMessageParam, options?: ChatRenderOptions): Promise<string | undefined>;
/**
 * Retrieves the reasoning content from the last assistant message in a message array.
 *
 * @param messages - An array of chat messages to search through.
 * @returns The reasoning content of the last assistant message, or undefined if none is found.
 */
export declare function lastAssistantReasoning(messages: ChatCompletionMessageParam[]): string;
/**
 * Renders a list of chat messages into a formatted markdown string.
 *
 * @param messages - The list of chat messages to render.
 * @param options - Configuration options for rendering, including text language, role filtering, cancellation token, and tool inclusion. Filters messages by system, user, assistant, and tool roles. Includes tools if provided. Handles cancellation tokens.
 * @returns A markdown string representation of the chat messages.
 */
export declare function renderMessagesToMarkdown(messages: ChatCompletionMessageParam[], options?: ChatRenderOptions): Promise<string>;
/**
 * Collapses chat messages to streamline content and remove redundancy.
 *
 * @param messages - The array of chat messages to process.
 *                   Each message contains properties such as role, content, and cacheControl.
 *                   Messages can include system, user, assistant, or tool roles.
 *
 * - Concatenates the content of consecutive "system" messages at the start of the array into a single "system" message, replacing the originals.
 * - Removes empty text content from "user" messages. For array-based content, filters out "text" types with no content.
 */
export declare function collapseChatMessages(messages: ChatCompletionMessageParam[]): void;
/**
 * Extracts and concatenates the output text from consecutive assistant messages in a chat history, applying post-processing based on the specified response type or schema.
 *
 * @param messages Array of chat messages to process.
 * @param options Optional configuration object:
 *   - responseType: Desired output format (e.g., "markdown", "yaml", "json", "text").
 *   - responseSchema: Schema for formatting/parsing the response, supporting custom prompt templates.
 *
 * @returns The concatenated and post-processed output text from the most recent assistant messages.
 */
export declare function assistantText(messages: ChatCompletionMessageParam[], options?: {
    responseType?: PromptTemplateResponseType;
    responseSchema?: PromptParametersSchema | JSONSchema;
}): string;
//# sourceMappingURL=chatrender.d.ts.map