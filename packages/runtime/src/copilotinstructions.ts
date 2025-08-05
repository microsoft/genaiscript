// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import type { WorkspaceFileSystem, WorkspaceFile, ChatGenerationContextOptions } from "@genaiscript/core";
import { frontmatterTryParse, isGlobMatch, genaiscriptDebug, resolveChatGenerationContext } from "@genaiscript/core";

const debug = genaiscriptDebug("copilotinstructions");

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
export interface CopilotInstructionsOptions extends ChatGenerationContextOptions {
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
 * files provided in env.files. When a chat generation context is provided, the instructions
 * are automatically added as system prompts.
 *
 * @param workspace - The workspace file system to read files from
 * @param envFiles - Array of files from env.files to match against instruction patterns
 * @param options - Configuration options for the import including optional chat generation context
 * @returns Promise that resolves to an array of relevant copilot instructions
 *
 * @example
 * ```typescript
 * // Import instructions that apply to current env.files
 * const instructions = await importCopilotInstructions(workspace, env.files);
 *
 * // Use with chat generation context to automatically add as system prompts
 * await importCopilotInstructions(workspace, env.files, { generator: ctx });
 * 
 * // Use the instructions in your script manually
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
    ...contextOptions
  } = options;

  debug(`importing copilot instructions for ${envFiles.length} files`);
  
  const instructions: CopilotInstruction[] = [];

  // Normalize env.files to just filenames for pattern matching
  const envFilenames = envFiles.map((file) => (typeof file === "string" ? file : file.filename));
  debug(`env filenames: ${envFilenames.join(", ")}`);

  // Search for instruction files in specified paths
  for (const instructionPath of instructionPaths) {
    debug(`searching instruction path: ${instructionPath}`);
    const searchPatterns = instructionPatterns.map((pattern) => `${instructionPath}/${pattern}`);
    debug(`search patterns: ${searchPatterns.join(", ")}`);

    try {
      const foundFiles = await workspace.findFiles(searchPatterns, {
        readText: true,
      });
      debug(`found ${foundFiles.length} instruction files in ${instructionPath}`);

      for (const file of foundFiles) {
        debug(`parsing instruction file: ${file.filename}`);
        const instruction = await parseInstructionFile(file);
        if (!instruction) {
          debug(`failed to parse instruction file: ${file.filename}`);
          continue;
        }

        // Check if this instruction applies to any of the env.files
        const shouldInclude = shouldIncludeInstruction(instruction, envFilenames, includeGeneral);
        debug(`instruction ${file.filename} should include: ${shouldInclude}`);
        
        if (shouldInclude) {
          instructions.push(instruction);
          debug(`included instruction from: ${file.filename}`);
        }
      }
    } catch (error) {
      debug(`error searching instruction path ${instructionPath}: ${error}`);
      // Silently continue if instruction path doesn't exist
      continue;
    }
  }

  debug(`total instructions found: ${instructions.length}`);

  // If a generator context is provided, add instructions as system-like content
  if (contextOptions.generator || Object.keys(contextOptions).length > 0) {
    const ctx = resolveChatGenerationContext(contextOptions);
    debug(`adding ${instructions.length} instructions as system content`);
    
    // Add instructions as system-like content using defChatParticipant
    ctx.defChatParticipant((turnCtx) => {
      if (instructions.length > 0) {
        turnCtx.$`## GitHub Copilot Instructions

The following instructions apply to the current files and should guide your responses:

${instructions.map(instruction => {
          let content = instruction.content;
          if (instruction.metadata?.description) {
            content = `### ${instruction.metadata.description}\n\n${content}`;
          }
          return `<!-- Source: ${instruction.filename} -->\n${content}`;
        }).join('\n\n---\n\n')}

---

`.role("system");
        debug(`added copilot instructions as system content`);
      }
    }, { label: "copilot-instructions" });
  }

  return instructions;
}

/**
 * Parses an instruction file and extracts its metadata and content
 */
async function parseInstructionFile(file: WorkspaceFile): Promise<CopilotInstruction | null> {
  if (!file.content) {
    debug(`no content in file: ${file.filename}`);
    return null;
  }

  const frontmatter = frontmatterTryParse(file.content);
  const content = frontmatter
    ? file.content.substring(file.content.indexOf("\n---\n") + 5)
    : file.content;

  debug(`parsed instruction file ${file.filename}, has frontmatter: ${!!frontmatter}`);
  if (frontmatter?.value?.applyTo) {
    debug(`applyTo patterns: ${JSON.stringify(frontmatter.value.applyTo)}`);
  }

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
    debug(`including general instruction: ${instruction.filename}`);
    return true;
  }

  // If no applyTo pattern and includeGeneral is false, skip
  if (!metadata?.applyTo) {
    debug(`skipping instruction without applyTo pattern: ${instruction.filename}`);
    return false;
  }

  // Check if any env.files match the applyTo patterns
  const applyToPatterns = Array.isArray(metadata.applyTo) ? metadata.applyTo : [metadata.applyTo];
  debug(`checking patterns ${JSON.stringify(applyToPatterns)} against files: ${envFilenames.join(", ")}`);

  const matches = envFilenames.some((filename) => isGlobMatch(filename, applyToPatterns));
  debug(`pattern match result for ${instruction.filename}: ${matches}`);
  
  return matches;
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
