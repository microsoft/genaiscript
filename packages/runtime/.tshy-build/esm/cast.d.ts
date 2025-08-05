import type { ChatGenerationContextOptions, JSONSchema, PromptGenerator, PromptGeneratorOptions, StringLike } from "@genaiscript/core";
/**
 * Converts unstructured text or data into structured JSON format.
 * Inspired by https://github.com/prefecthq/marvin.
 *
 * @param data - Input text or a prompt generator function to convert.
 * @param itemSchema - JSON schema defining the target data structure. If `multiple` is true, this will be treated as an array schema.
 * @param options - Configuration options for the conversion process, including context, instructions, label, and additional settings. If `multiple` is true, the schema will be treated as an array schema.
 * @returns An object containing the converted data, error information if applicable, and the raw text response.
 */
export declare function cast(data: StringLike | PromptGenerator, itemSchema: JSONSchema, options?: PromptGeneratorOptions & ChatGenerationContextOptions & {
    multiple?: boolean;
    instructions?: string | PromptGenerator;
}): Promise<{
    data?: unknown;
    error?: string;
    text: string;
}>;
//# sourceMappingURL=cast.d.ts.map