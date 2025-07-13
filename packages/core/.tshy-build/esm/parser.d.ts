import { Project } from "./server/messages.js";
import type { CharPosition } from "./types.js";
/**
 * Converts a string to a character position represented as [row, column].
 * Uses newline characters to calculate the row (number of newlines) and column (characters after the last newline).
 * If the string is empty, returns [0, 0].
 * @param str - The input string to convert.
 * @returns The position as [row, column].
 */
export declare function stringToPos(str: string): CharPosition;
/**
 * Parses a project based on the provided script files.
 * Initializes a project, reads system and user scripts, and updates with parsed templates.
 * Filters invalid or duplicate scripts and sorts templates.
 * Computes resolved systems and input schemas for non-system scripts.
 * @param options - Contains an array of script file paths to process.
 * @returns Project - The project with processed templates and diagnostics.
 */
export declare function parseProject(options: {
    installDir: string;
    scriptFiles: string[];
}): Promise<Project>;
//# sourceMappingURL=parser.d.ts.map