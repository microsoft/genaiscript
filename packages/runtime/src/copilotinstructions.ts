// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import type { WorkspaceFileSystem, WorkspaceFile } from "@genaiscript/core";
import { frontmatterTryParse, isGlobMatch } from "@genaiscript/core";

/**
 * Represents a copilot instruction file with its content and metadata
 */
export interface CopilotInstruction {
  /** The file path of the instruction file */
  filename: string;
  /** The instruction content */
  content: string;
  /** Parsed frontmatter metadata */
  metadata?: {
    /** File patterns this instruction applies to */
    applyTo?: string | string[];
    /** Description of the instruction */
    description?: string;
    [key: string]: any;
  };
}

/**
 * Configuration options for importing copilot instructions
 */
export interface CopilotInstructionsOptions {
  /** Whether to include general copilot instructions file (default: true) */
  includeGeneral?: boolean;
  /** Custom paths to search for instruction files (default: [".github/instructions", ".github"]) */
  instructionPaths?: string[];
  /** Custom patterns to match instruction files (default: ["*.instructions.md", "copilot-instructions.md"]) */
  instructionPatterns?: string[];
}

/**
 * Runtime helper to automatically import copilot instruction files based on env.files.
 * 
 * This function searches for GitHub Copilot instruction files and filters them based on 
 * file patterns specified in their frontmatter `applyTo` field, matching against the 
 * files provided in env.files.
 * 
 * @param workspace - The workspace file system to read files from
 * @param envFiles - Array of files from env.files to match against instruction patterns
 * @param options - Configuration options for the import
 * @returns Promise that resolves to an array of relevant copilot instructions
 * 
 * @example
 * ```typescript
 * // Import instructions that apply to current env.files
 * const instructions = await importCopilotInstructions(workspace, env.files);
 * 
 * // Use the instructions in your script
 * for (const instruction of instructions) {
 *   console.log(`Applying instruction from ${instruction.filename}:`);
 *   console.log(instruction.content);
 * }
 * ```
 */
export async function importCopilotInstructions(
  workspace: WorkspaceFileSystem,
  envFiles: WorkspaceFile[] | string[],
  options: CopilotInstructionsOptions = {},
): Promise<CopilotInstruction[]> {
  const {
    includeGeneral = true,
    instructionPaths = [".github/instructions", ".github"],
    instructionPatterns = ["*.instructions.md", "copilot-instructions.md"],
  } = options;

  const instructions: CopilotInstruction[] = [];
  
  // Normalize env.files to just filenames for pattern matching
  const envFilenames = envFiles.map((file) => 
    typeof file === "string" ? file : file.filename
  );

  // Search for instruction files in specified paths
  for (const instructionPath of instructionPaths) {
    const searchPatterns = instructionPatterns.map((pattern) => 
      `${instructionPath}/${pattern}`
    );

    try {
      const foundFiles = await workspace.findFiles(searchPatterns, {
        readText: true,
      });

      for (const file of foundFiles) {
        const instruction = await parseInstructionFile(file);
        if (!instruction) continue;

        // Check if this instruction applies to any of the env.files
        if (shouldIncludeInstruction(instruction, envFilenames, includeGeneral)) {
          instructions.push(instruction);
        }
      }
    } catch (error) {
      // Silently continue if instruction path doesn't exist
      continue;
    }
  }

  return instructions;
}

/**
 * Parses an instruction file and extracts its metadata and content
 */
async function parseInstructionFile(file: WorkspaceFile): Promise<CopilotInstruction | null> {
  if (!file.content) return null;

  const frontmatter = frontmatterTryParse(file.content);
  const content = frontmatter 
    ? file.content.substring(file.content.indexOf('\n---\n') + 5)
    : file.content;

  return {
    filename: file.filename,
    content: content.trim(),
    metadata: frontmatter?.value,
  };
}

/**
 * Determines if an instruction should be included based on its applyTo patterns
 * and whether it matches any of the env.files
 */
function shouldIncludeInstruction(
  instruction: CopilotInstruction,
  envFilenames: string[],
  includeGeneral: boolean,
): boolean {
  const { metadata } = instruction;
  
  // Include general copilot instructions if enabled and no specific applyTo pattern
  if (includeGeneral && !metadata?.applyTo) {
    return true;
  }

  // If no applyTo pattern and includeGeneral is false, skip
  if (!metadata?.applyTo) {
    return false;
  }

  // Check if any env.files match the applyTo patterns
  const applyToPatterns = Array.isArray(metadata.applyTo) 
    ? metadata.applyTo 
    : [metadata.applyTo];

  return envFilenames.some((filename) =>
    isGlobMatch(filename, applyToPatterns)
  );
}

/**
 * Helper function to format copilot instructions for use in prompts
 * 
 * @param instructions - Array of copilot instructions to format
 * @param options - Formatting options
 * @returns Formatted instruction text suitable for inclusion in prompts
 * 
 * @example
 * ```typescript
 * const instructions = await importCopilotInstructions(workspace, env.files);
 * const formattedInstructions = formatCopilotInstructions(instructions);
 * 
 * $`## Instructions
 * 
 * ${formattedInstructions}
 * 
 * ## Task
 * 
 * Please help me with the following task...`
 * ```
 */
export function formatCopilotInstructions(
  instructions: CopilotInstruction[],
  options: {
    /** Include instruction source filenames (default: false) */
    includeSourceInfo?: boolean;
    /** Separator between instructions (default: double newline) */
    separator?: string;
  } = {},
): string {
  const { includeSourceInfo = false, separator = "\n\n" } = options;

  return instructions
    .map((instruction) => {
      let content = instruction.content;
      
      if (includeSourceInfo) {
        const sourceInfo = `<!-- Source: ${instruction.filename} -->`;
        content = `${sourceInfo}\n${content}`;
      }
      
      return content;
    })
    .join(separator);
}