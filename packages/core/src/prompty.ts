// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ChatCompletionContentPart, ChatCompletionMessageParam } from "./chattypes.js";
import { splitMarkdown } from "./frontmatter.js";
import { YAMLParse } from "./yaml.js";
import { deleteUndefinedValues } from "./cleaners.js";
import { JSON5Stringify } from "./json5.js";
import type { JSONSchemaSimpleType, PromptyDocument } from "./types.js";

function promptyFrontmatterToMeta(frontmatter: PromptyFrontmatter): PromptArgs {
  const {
    name,
    description,
    tags = [],
    sample,
    inputs,
    outputs,
    model,
    files,
    tests,
  } = frontmatter;
  const { api = "chat", configuration, parameters: modelParameters } = model ?? {};
  const parameters: Record<string, JSONSchemaSimpleType> = inputs
    ? Object.entries(inputs).reduce<Record<string, JSONSchemaSimpleType>>((acc, [k, v]) => {
        if (v.type === "list") acc[k] = { type: "array" };
        else acc[k] = v;
        return acc;
      }, {})
    : undefined;
  if (parameters && sample && typeof sample === "object")
    for (const p in sample) {
      const s = sample[p];
      const pp = parameters[p];
      if (s !== undefined && pp) pp.default = s;
    }

  let modelName: string = undefined;
  if (api !== "chat") throw new Error("completion api not supported");
  if (modelParameters?.n > 1) throw new Error("multi-turn not supported");
  if (modelParameters?.tools?.length) throw new Error("tools not supported");

  // resolve model
  if (configuration?.type === "azure_openai" || configuration?.type === "azure") {
    if (!configuration.azure_deployment) throw new Error("azure_deployment required");
    modelName = `azure:${configuration.azure_deployment}`;
  } else if (configuration?.type === "azure_serverless") {
    modelName = `azure_serverless:${configuration.azure_endpoint}`;
  } else if (configuration?.type === "openai") modelName = `openai:${configuration.type}`;
  const unlisted = tags.includes("unlisted");
  const meta = deleteUndefinedValues({
    model: modelName,
    title: name,
    description,
    files,
    tests,
    unlisted: unlisted ? true : undefined,
    parameters,
    responseType: outputs ? "json_object" : modelParameters?.response_format?.type,
    responseSchema: outputs,
    temperature: modelParameters?.temperature,
    maxTokens: modelParameters?.max_tokens,
    topP: modelParameters?.top_p,
    seed: modelParameters?.seed,
  } satisfies PromptArgs);
  return meta;
}

/**
 * Parses a prompty document from a given filename and text content.
 *
 * @param filename - The name of the file being processed. This is used to associate metadata with the document.
 * @param text - The raw text of the document, including optional frontmatter and content body.
 * @returns An object representing the parsed prompty document. It includes metadata, parsed frontmatter, remaining content, and extracted messages.
 *
 * The parsing process:
 * - Splits the document into frontmatter and content using a helper function.
 * - Converts frontmatter content into metadata via a transformation function.
 * - Processes the content to extract structured message blocks, identified by "system", "user", or "assistant" roles.
 * - Each message block is trimmed and stored alongside its role for further use.
 * - Throws an error if improper formatting, such as whitespace before frontmatter markers, is detected.
 */
export function promptyParse(filename: string, text: string): PromptyDocument {
  const { frontmatter = "", content = "" } = splitMarkdown(text);
  if (!frontmatter && /^\s+---/.test(frontmatter))
    throw new Error("Prompty: Frontmatter has invalid whitespace before ---");
  const fm = frontmatter ? YAMLParse(frontmatter) : {};
  const meta: PromptArgs = fm ? promptyFrontmatterToMeta(fm) : {};
  if (filename) meta.filename = filename;
  const messages: ChatCompletionMessageParam[] = [];

  // split
  const rx = /^\s*(system|user|assistant)\s*:\s*$/gim;
  const lines = content.split(/\r?\n/g);
  let role: "system" | "user" | "assistant" | undefined = "system";
  let chunk: string[] = [];

  const pushMessage = () => {
    if (role && chunk.length && chunk.some((l) => !!l)) {
      messages.push({
        role,
        content: chunk.join("\n").trim(),
      });
    }
  };

  for (const line of lines) {
    const m = rx.exec(line);
    if (m) {
      // next role starts
      pushMessage();
      role = m[1] as "system" | "user" | "assistant";
      chunk = [];
    } else {
      chunk.push(line);
    }
  }
  pushMessage();
  return { meta, frontmatter: fm, content, messages };
}

/**
 * Converts a PromptyDocument into a script compatible with GenAI.
 *
 * @param doc - The PromptyDocument containing metadata, content, and messages.
 *    - `meta`: Metadata extracted from the document's frontmatter, such as model, parameters, and other configuration values.
 *    - `messages`: Array of chat messages with roles (system, user, assistant) and respective content.
 *
 * Generates a script string by mapping chat roles and content into reusable GenAI script components:
 * - System messages are represented using `writeText`.
 * - Assistant messages are processed using `parsers.jinja`.
 * - User message content is rendered as Jinja templates or other compatible parts (e.g., text, image_url, input_audio).
 *
 * Returns a string containing the final generated AI script.
 */
export function promptyToGenAIScript(doc: PromptyDocument): string {
  const { messages, meta } = doc;

  const renderJinja = (content: string) =>
    `$\`${content.replace(/`/g, "\\`")}\`${/\{(%|\{)/.test(content) ? `.jinja(env.vars)` : ""}`;
  const renderPart = (c: ChatCompletionContentPart) =>
    c.type === "text"
      ? renderJinja(c.text)
      : c.type === "image_url"
        ? `defImages("${c.image_url}")`
        : c.type === "input_audio"
          ? `defAudio("${c.input_audio}")`
          : `unknown message`;

  let src = ``;
  if (Object.keys(meta).length) {
    src += `script(${JSON5Stringify(meta, null, 2)})\n\n`;
  }
  src += messages
    .map((msg) => {
      const { role, content } = msg;
      if (role === "assistant") {
        return `assistant(parsers.jinja(${JSON.stringify(content as string)}, env.vars))`;
      } else if (role === "system") {
        return `writeText(${JSON.stringify(content as string)}, { role: "system" })`;
      } else {
        if (typeof content === "string") return renderJinja(content);
        else if (Array.isArray(content)) return content.map(renderPart).join("\n");
        else return renderPart(content);
      }
    })
    .join("\n");

  return src;
}
