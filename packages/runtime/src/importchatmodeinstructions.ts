// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * GenAIScript supporting runtime
 * This module provides functionality for importing VSCode chat mode instruction files
 */
import type {
  ElementOrArray,
  ImportTemplateOptions,
  WorkspaceFile,
} from "@genaiscript/core";
import {
  arrayify,
  expandFileOrWorkspaceFiles,
  resolveFileContent,
  approximateTokens,
} from "@genaiscript/core";

/**
 * Options for importing chat mode instruction files
 */
export interface ImportChatModeInstructionsOptions extends ImportTemplateOptions {}

/**
 * Result of importing chat mode instruction files
 */
export interface ImportChatModeInstructionsResult {
  /**
   * The concatenated content of all found instruction files
   */
  content: string;
  /**
   * Array of files that were found and imported
   */
  files: WorkspaceFile[];
  /**
   * Approximate token count of the content
   */
  tokens: number;
}

/**
 * Default patterns for VSCode chat mode instruction files
 */
export const DEFAULT_CHAT_MODE_INSTRUCTION_PATTERNS = [
  ".github/copilot-instructions.md",
  ".github/copilot-instructions.txt",
  ".vscode/copilot-instructions.md",
  ".vscode/copilot-instructions.txt",
  "copilot-instructions.md",
  "copilot-instructions.txt",
];

/**
 * Imports VSCode chat mode instruction files and returns their content.
 * This function searches for common instruction file patterns and returns the combined content.
 * 
 * @param patterns Optional file patterns to search for. Defaults to common VSCode instruction patterns.
 * @param options Optional import options such as maxTokens for limiting content size
 * @returns Promise containing the combined content, found files, and token count
 * 
 * @example
 * ```typescript
 * // Import using default patterns
 * const result = await importChatModeInstructions();
 * console.log(result.content);
 * 
 * // Import with custom patterns
 * const customResult = await importChatModeInstructions([".github/my-guidelines.md"]);
 * 
 * // Import with options
 * const limitedResult = await importChatModeInstructions(undefined, { maxTokens: 1000 });
 * ```
 */
export async function importChatModeInstructions(
  patterns?: ElementOrArray<string>,
  options?: ImportChatModeInstructionsOptions,
): Promise<ImportChatModeInstructionsResult> {
  // Use default patterns if none provided
  const searchPatterns = patterns ? arrayify(patterns) : DEFAULT_CHAT_MODE_INSTRUCTION_PATTERNS;
  
  // Find files matching the patterns
  const files: WorkspaceFile[] = await expandFileOrWorkspaceFiles(searchPatterns);
  
  // Resolve content for each file
  for (const file of files) {
    await resolveFileContent(file, options);
  }
  
  // Combine all content
  const content = files.map(f => f.content).filter(Boolean).join('\n');
  
  // Calculate approximate tokens
  const tokens = approximateTokens(content);
  
  return {
    content,
    files,
    tokens,
  };
}