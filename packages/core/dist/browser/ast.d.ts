import type { Project } from "./server/messages.js";
import type { Diagnostic, PromptScript, SystemPromptInstance } from "./types.js";
export interface FileReference {
    name: string;
    filename: string;
}
/**
 * Converts an array of diagnostic objects into a CSV-formatted string.
 * Each diagnostic entry includes severity, filename, range start and end lines, code, and message.
 * @param diagnostics - Array of diagnostic objects with severity, filename, range, code, and message properties.
 * @param sep - Separator string for CSV fields.
 * @returns CSV string with each diagnostic entry on a new line.
 */
export declare function diagnosticsToCSV(diagnostics: Diagnostic[], sep: string): string;
/**
 * Determines the group name of a template.
 * @param template - The template object containing an ID and an optional group property.
 * @returns The group name of the template. Returns the group property if defined, "system" if the ID starts with "system", or "unassigned" if no group is set or determined.
 */
export declare function templateGroup(template: PromptScript): string;
/**
 * Collects and organizes templates by their directory, identifying the presence of JavaScript or TypeScript files in each directory.
 * Excludes templates without filenames.
 * @param prj - The project containing the scripts to analyze.
 * @returns An array of directory objects with their names and flags indicating JavaScript and TypeScript file presence.
 */
export declare function collectFolders(prj: Project, options?: {
    force?: boolean;
}): {
    dirname: string;
    js?: boolean;
    ts?: boolean;
}[];
/**
 * Finds a script in the project's scripts list by matching its ID with the system prompt instance.
 * If the project or scripts list is undefined, returns undefined.
 * @param prj - The project containing the scripts to search.
 * @param system - The system prompt instance containing the ID to match against.
 * @returns The script with the matching ID, or undefined if no match is found.
 */
export declare function resolveScript(prj: Project, system: SystemPromptInstance): PromptScript;
export interface ScriptFilterOptions {
    ids?: string[];
    groups?: string[];
    test?: boolean;
    redteam?: boolean;
    unlisted?: boolean;
}
/**
 * Filters a list of scripts based on the provided filter options.
 *
 * @param scripts - The list of scripts to filter.
 * @param options - An object containing filter criteria:
 *   - ids: Array of specific script IDs to include.
 *   - groups: Array of group names to filter by.
 *   - test: If true, includes only scripts with defined tests.
 *   - redteam: If true, includes only scripts marked for redteam.
 *   - unlisted: If true, includes unlisted scripts; otherwise excludes them.
 * @returns A filtered list of scripts matching the given criteria.
 */
export declare function filterScripts(scripts: PromptScript[], options: ScriptFilterOptions): PromptScript[];
//# sourceMappingURL=ast.d.ts.map