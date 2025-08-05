import type { ChatCompletionMessageParam } from "./chattypes.js";
/**
 * Renders a string template using the Jinja templating engine.
 *
 * This function takes a Jinja template string and an object containing
 * key-value pairs. It uses the Jinja engine to replace placeholders
 * in the template with the corresponding values from the object.
 *
 * @param template - The string containing Jinja template syntax.
 * @param values - An object with key-value pairs to replace in the template.
 * @returns The rendered string with values substituted.
 */
export declare function jinjaRender(template: string, values: Record<string, any>): string;
/**
 * Renders a chat message using Jinja template syntax.
 *
 * This function processes a chat message object and renders its content
 * using provided arguments. The content can include text, image URLs,
 * or refusal messages, which are formatted into a Jinja-compatible
 * template string before substitution.
 *
 * @param msg - The chat message object containing the content to render.
 *   If the content is a string, it is used directly; otherwise, its
 *   components are processed based on their type.
 * @param args - A key-value mapping of arguments to replace the placeholders
 *   within the Jinja template derived from the chat message content.
 * @returns The rendered string with the placeholders substituted using the
 *   provided arguments.
 */
export declare function jinjaRenderChatMessage(msg: ChatCompletionMessageParam, args: Record<string, any>): string;
//# sourceMappingURL=jinja.d.ts.map