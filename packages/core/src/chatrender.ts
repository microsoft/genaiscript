// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import type {
  ChatCompletionAssistantMessageParam,
  ChatCompletionMessageParam,
  ChatCompletionSystemMessageParam,
  ChatCompletionTool,
  ChatCompletionToolMessageParam,
  ChatCompletionUserMessageParam,
} from "./chattypes.js";
import { collapseNewlines } from "./cleaners.js";
import type {
  JSONSchema,
  PromptParametersSchema,
  PromptTemplateResponseType,
  ShellOutput,
} from "./types.js";

// Import utility functions for JSON5 parsing, markdown formatting, and YAML stringification.
import { JSONLLMTryParse } from "./json5.js";
import { details, fenceMD } from "./mkmd.js";
import { stringify as YAMLStringify } from "yaml";
import { CancellationOptions, checkCancelled } from "./cancellation.js";
import { unthink } from "./think.js";
import { unfence } from "./unwrappers.js";

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
export function renderShellOutput(output: ShellOutput) {
  // Destructure the output object to retrieve exitCode, stdout, and stderr.
  const { exitCode, stdout, stderr } = output;
  if (exitCode === 0) return stdout;
  return (
    [
      // Include exit code in the output only if it's non-zero.
      exitCode !== 0 ? `EXIT_CODE: ${exitCode}` : undefined,
      // Include stdout if it exists, formatted as text.
      stdout ? `STDOUT:${fenceMD(stdout, "text")}` : undefined,
      // Include stderr if it exists, formatted as text.
      stderr ? `STDERR:${fenceMD(stderr, "text")}` : undefined,
    ]
      // Filter out undefined values from the array.
      .filter((s) => s)
      // Join the elements with two newlines for separation.
      .join("\n\n")
  );
}

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
export async function renderMessageContent(
  msg:
    | ChatCompletionAssistantMessageParam
    | ChatCompletionSystemMessageParam
    | ChatCompletionUserMessageParam
    | ChatCompletionToolMessageParam,
  options?: ChatRenderOptions,
): Promise<string | undefined> {
  const { cacheImage, textLang } = options || {};
  const content = msg.content;

  // Return the content directly if it's a simple string.
  if (typeof content === "string") {
    if (textLang === "raw") return content;
    else return fenceMD(content, textLang);
  }
  // If the content is an array, process each element based on its type.
  else if (Array.isArray(content)) {
    const res: string[] = [];
    for (const c of content) {
      switch (c.type) {
        case "text":
          if (textLang === "raw") res.push(c.text);
          else res.push(fenceMD(c.text, textLang));
          break;
        case "image_url":
          res.push(`\n\n![image](${(await cacheImage?.(c.image_url.url)) || c.image_url.url})\n\n`);
          break;
        case "input_audio":
          res.push(`🔊 [audio](${c.input_audio})`);
          break;
        case "refusal":
          res.push(`refused: ${c.refusal}`);
          break;
        default:
          res.push(`unknown message`);
      }
    }
    return res.join(" ");
  }
  // Return undefined if the content is neither a string nor an array.
  return undefined;
}

/**
 * Retrieves the reasoning content from the last assistant message in a message array.
 *
 * @param messages - An array of chat messages to search through.
 * @returns The reasoning content of the last assistant message, or undefined if none is found.
 */
export function lastAssistantReasoning(messages: ChatCompletionMessageParam[]) {
  const last = messages.at(-1);
  return last?.role === "assistant" && last.reasoning_content;
}

/**
 * Renders a list of chat messages into a formatted markdown string.
 *
 * @param messages - The list of chat messages to render.
 * @param options - Configuration options for rendering, including text language, role filtering, cancellation token, and tool inclusion. Filters messages by system, user, assistant, and tool roles. Includes tools if provided. Handles cancellation tokens.
 * @returns A markdown string representation of the chat messages.
 */
export async function renderMessagesToMarkdown(
  messages: ChatCompletionMessageParam[],
  options?: ChatRenderOptions,
) {
  // Set default options for filtering message roles.
  const {
    textLang = "markdown",
    system = undefined, // Include system messages unless explicitly set to false.
    user = undefined, // Include user messages unless explicitly set to false.
    assistant = true, // Include assistant messages by default.
    cancellationToken,
    tools,
  } = options || {};
  options = {
    textLang,
    system,
    user,
    assistant,
    cancellationToken,
    tools,
  };
  const optionsMarkdown: ChatRenderOptions = {
    textLang: "markdown",
    system,
    user,
    assistant,
    cancellationToken,
    tools,
  };

  const res: string[] = [];

  if (tools?.length) {
    res.push(
      details(
        `🔧 tools (${tools.length})`,
        tools
          .map((tool) => `-  \`${tool.function.name}\`: ${tool.function.description || ""}`)
          .join("\n"),
      ),
    );
  }

  for (const msg of messages?.filter((msg) => {
    // Filter messages based on their roles.
    switch (msg.role) {
      case "system":
        return system !== false;
      case "user":
        return user !== false;
      case "assistant":
        return assistant !== false;
      default:
        return true;
    }
  })) {
    checkCancelled(cancellationToken);
    const { role } = msg;
    switch (role) {
      case "system":
        res.push(details("📙 system", await renderMessageContent(msg, optionsMarkdown), false));
        break;
      case "user":
        res.push(details(`👤 user`, await renderMessageContent(msg, options), user === true));
        break;
      case "assistant":
        res.push(
          details(
            `🤖 assistant ${msg.name ? msg.name : ""}`,
            [
              msg.reasoning_content
                ? details("🤔 reasoning", fenceMD(msg.reasoning_content, "markdown"))
                : undefined,
              await renderMessageContent(msg, optionsMarkdown),
              ...(msg.tool_calls?.map((tc) =>
                details(
                  `📠 tool call <code>${tc.function.name}</code> (<code>${tc.id}</code>)`,
                  renderToolArguments(tc.function.arguments),
                ),
              ) || []),
            ]
              .filter((s) => !!s)
              .join("\n\n"),
            assistant === true,
          ),
        );
        break;
      case "tool":
        res.push(
          details(
            `🛠️ tool output <code>${msg.tool_call_id}</code>`,
            await renderMessageContent(msg, {
              ...(options || {}),
              textLang: "json",
            }),
          ),
        );
        break;
      default:
        res.push(role, fenceMD(JSON.stringify(msg, null, 2), "json"));
        break;
    }
  }
  // Join the result array into a single markdown string.
  return collapseNewlines(res.filter((s) => s !== undefined).join("\n"));
}

/**
 * Parses and renders tool arguments into formatted YAML or JSON.
 * @param args - The tool arguments as a string.
 * @returns A formatted string in YAML or JSON.
 */
function renderToolArguments(args: string) {
  const js = JSONLLMTryParse(args);
  // Convert arguments to YAML if possible, otherwise keep as JSON.
  if (js) return fenceMD(YAMLStringify(js), "yaml");
  else return fenceMD(args, "json");
}

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
export function collapseChatMessages(messages: ChatCompletionMessageParam[]) {
  // concat the content of system messages at the start of the messages into a single message
  const startSystem = messages.findIndex((m) => m.role === "system");
  if (startSystem > -1) {
    let endSystem =
      startSystem +
      messages.slice(startSystem).findIndex((m) => m.role !== "system" || m.cacheControl);
    if (endSystem < 0) endSystem = messages.length;
    if (endSystem > startSystem + 1) {
      const systemContent = messages
        .slice(startSystem, endSystem)
        .map((m) => m.content)
        .join("\n");
      messages.splice(startSystem, endSystem - startSystem, {
        role: "system",
        content: systemContent,
      });
    }
  }

  // remove empty text contents
  messages
    .filter((m) => m.role === "user")
    .forEach((m) => {
      if (typeof m.content !== "string")
        m.content = m.content.filter((c) => c.type !== "text" || c.text);
    });
}

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
export function assistantText(
  messages: ChatCompletionMessageParam[],
  options?: {
    responseType?: PromptTemplateResponseType;
    responseSchema?: PromptParametersSchema | JSONSchema;
  },
) {
  const { responseType, responseSchema } = options || {};
  let text = "";
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role !== "assistant") {
      break;
    }
    let content: string = "";
    if (typeof msg.content === "string") {
      content = msg.content;
    } else if (Array.isArray(msg.content)) {
      for (const part of msg.content) {
        if (part.type === "text") {
          content = content + part.text;
        } else if (part.type === "refusal") {
          content = `refusal: ${part.refusal}\n` + content;
          break;
        }
      }
    }
    text = content + text;
  }

  text = unthink(text);
  if ((!responseType && !responseSchema) || responseType === "markdown") {
    text = unfence(text, ["markdown", "md"]);
  } else if (responseType === "yaml") {
    text = unfence(text, ["yaml", "yml"]);
  } else if (/^json/.test(responseType)) {
    text = unfence(text, ["json", "json5"]);
  } else if (responseType === "text") {
    text = unfence(text, ["text", "txt"]);
  }

  return text;
}
