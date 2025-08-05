import type { PromptArgs, PromptScript } from "./types.js";
/**
 * Extracts a template ID from the given filename by removing specific extensions
 * and directories.
 *
 * @param filename - The filename to extract the template ID from.
 * @returns The extracted template ID.
 */
export declare function templateIdFromFileName(filename: string): string;
/**
 * Parses metadata from the provided JavaScript source code. Determines the script type
 * (e.g., "system" or "script"), extracts metadata, and identifies tools defined in the script.
 *
 * @param jsSource - The JavaScript source code to analyze.
 * @returns An object containing extracted metadata, tool definitions, and system-specific properties.
 */
export declare function parsePromptScriptMeta(jsSource: string): PromptArgs & Pick<PromptScript, "defTools">;
/**
 * Parses a prompt script file, validating its structure and content.
 *
 * @param filename - The filename of the script.
 * @param content - The content of the script.
 * @returns The parsed PromptScript or undefined in case of errors.
 */
export declare function parsePromptScript(filename: string, content: string): Promise<PromptScript>;
//# sourceMappingURL=template.d.ts.map