import { ChatCompletionTool, CreateChatCompletionRequest } from "./chattypes.js";
/**
 * Renders a list of chat messages to an interactive terminal output.
 *
 * @param messages - The list of chat messages to render. Each message consists of role-specific content and attributes.
 * @param options - Configuration options for rendering:
 *   - system: Controls whether system messages are included. Defaults to true unless explicitly set to false.
 *   - user: Controls whether user messages are included. Defaults to true unless explicitly set to false.
 *   - assistant: Controls whether assistant messages are included. Defaults to true.
 *   - tools: Optional list of tools to be displayed, each containing metadata such as function names.
 *
 * @returns The formatted string output for terminal rendering.
 */
export declare function renderMessagesToTerminal(
  request: CreateChatCompletionRequest,
  options?: {
    system?: boolean;
    user?: boolean;
    assistant?: boolean;
    tools?: ChatCompletionTool[];
  },
): Promise<string>;
//# sourceMappingURL=chatrenderterminal.d.ts.map
