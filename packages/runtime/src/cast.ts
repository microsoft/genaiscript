// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import type {
  ChatGenerationContextOptions,
  JSONSchema,
  JSONSchemaArray,
  PromptGenerator,
  PromptGeneratorOptions,
  StringLike,
} from "@genaiscript/core";
import { resolveChatGenerationContext } from "./runtime.js";

/**
 * Converts unstructured text or data into structured JSON format.
 * Inspired by https://github.com/prefecthq/marvin.
 *
 * @param data - Input text or a prompt generator function to convert.
 * @param itemSchema - JSON schema defining the target data structure. If `multiple` is true, this will be treated as an array schema.
 * @param options - Configuration options for the conversion process, including context, instructions, label, and additional settings. If `multiple` is true, the schema will be treated as an array schema.
 * @returns An object containing the converted data, error information if applicable, and the raw text response.
 */
export async function cast(
  data: StringLike | PromptGenerator,
  itemSchema: JSONSchema,
  options?: PromptGeneratorOptions &
    ChatGenerationContextOptions & {
      multiple?: boolean;
      instructions?: string | PromptGenerator;
    },
): Promise<{ data?: unknown; error?: string; text: string }> {
  const ctx = resolveChatGenerationContext(options);
  const { multiple, instructions, label = `cast text to schema`, ...rest } = options || {};
  const responseSchema = multiple
    ? ({
        type: "array",
        items: itemSchema,
      } satisfies JSONSchemaArray)
    : itemSchema;
  const res = await ctx.runPrompt(
    async (_) => {
      if (typeof data === "function") await data(_);
      else _.def("SOURCE", data);
      _.defSchema("SCHEMA", responseSchema, { format: "json" });
      _.$`You are an expert data converter specializing in transforming unstructured text source into structured data.
            Convert the contents of <SOURCE> to JSON using schema <SCHEMA>.
            - Treat images as <SOURCE> and convert them to JSON.
            - Make sure the returned data matches the schema in <SCHEMA>.`;
      if (typeof instructions === "string") _.$`${instructions}`;
      else if (typeof instructions === "function") await instructions(_);
    },
    {
      responseSchema,
      ...rest,
      label,
    },
  );
  const text = parsers.unfence(res.text, "json");
  return res.json ? { text, data: res.json } : { text, error: res.error?.message };
}
