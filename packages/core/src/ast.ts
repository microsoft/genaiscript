/// <reference path="./types/prompt_template.d.ts" />
// Import necessary regular expressions for file type detection and host utilities
import {
    GENAI_ANYJS_REGEX,
    GENAI_ANYTS_REGEX,
    PROMPTY_REGEX,
} from "./constants"
import { Project } from "./server/messages"
import { arrayify } from "./cleaners"
import { tagFilter } from "./tags"
import { dirname, resolve } from "node:path"

// Interface representing a file reference, with a name and filename property
export interface FileReference {
    name: string
    filename: string
}

/**
 * Converts an array of diagnostic objects into a CSV-formatted string.
 * Each diagnostic entry includes severity, filename, range start and end lines, code, and message.
 * @param diagnostics - Array of diagnostic objects with severity, filename, range, code, and message properties.
 * @param sep - Separator string for CSV fields.
 * @returns CSV string with each diagnostic entry on a new line.
 */
export function diagnosticsToCSV(diagnostics: Diagnostic[], sep: string) {
    return diagnostics
        .map(
            ({ severity, filename, range, code, message }) =>
                [
                    severity, // Severity level of the diagnostic
                    filename, // Filename where the diagnostic occurred
                    range[0][0], // Start line of the diagnostic range
                    range[1][0], // End line of the diagnostic range
                    code || "", // Diagnostic code, if available; empty string if not
                    message, // Diagnostic message explaining the issue
                ].join(sep) // Join fields with the specified separator
        )
        .join("\n") // Join each CSV line with a newline character
}

/**
 * Determines the group name of a template.
 * @param template - The template object containing an ID and an optional group property.
 * @returns The group name of the template. Returns the group property if defined, "system" if the ID starts with "system", or "unassigned" if no group is set or determined.
 */
export function templateGroup(template: PromptScript) {
    return (
        template.group || // Return the group if already set
        (/^system/i.test(template.id) ? "system" : "") || // Check if the template ID indicates it's a system template
        "unassigned" // Default to "unassigned" if no group is determined
    )
}

// Constants representing special character positions within a file
export const eolPosition = 0x3fffffff // End of line position, a large constant
export const eofPosition: CharPosition = [0x3fffffff, 0] // End of file position, a tuple with a large constant

/**
 * Collects and organizes templates by their directory, identifying the presence of JavaScript or TypeScript files in each directory.
 * Excludes templates without filenames or those matching PROMPTY_REGEX.
 * @param prj - The project containing the scripts to analyze.
 * @returns An array of directory objects with their names and flags indicating JavaScript and TypeScript file presence.
 */
export function collectFolders(
    prj: Project,
    options?: { force?: boolean }
): { dirname: string; js?: boolean; ts?: boolean }[] {
    const { force } = options || {}
    const { systemDir } = prj
    const folders: Record<
        string,
        { dirname: string; js?: boolean; ts?: boolean }
    > = {}
    for (const t of Object.values(prj.scripts).filter(
        // must have a filename and not prompty
        (t) => t.filename && !PROMPTY_REGEX.test(t.filename)
    )) {
        const dir = dirname(t.filename) // Get directory name from the filename
        if (!force && resolve(dir) === systemDir) continue
        const folder = folders[dir] || (folders[dir] = { dirname: dir })
        folder.js = folder.js || GENAI_ANYJS_REGEX.test(t.filename) // Check for presence of JS files
        folder.ts = folder.ts || GENAI_ANYTS_REGEX.test(t.filename) // Check for presence of TS files
    }
    return Object.values(folders) // Return an array of folders with their properties
}

/**
 * Finds a script in the project's scripts list by matching its ID with the system prompt instance.
 * If the project or scripts list is undefined, returns undefined.
 * @param prj - The project containing the scripts to search.
 * @param system - The system prompt instance containing the ID to match against.
 * @returns The script with the matching ID, or undefined if no match is found.
 */
export function resolveScript(prj: Project, system: SystemPromptInstance) {
    return prj?.scripts?.find((t) => t.id == system.id) // Find and return the template with the matching ID
}

export interface ScriptFilterOptions {
    ids?: string[]
    groups?: string[]
    test?: boolean
    redteam?: boolean
    unlisted?: boolean
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
export function filterScripts(
    scripts: PromptScript[],
    options: ScriptFilterOptions
) {
    const { ids, groups, test, redteam, unlisted } = options || {}
    return scripts
        .filter((t) => !test || arrayify(t.tests)?.length)
        .filter((t) => !redteam || t.redteam)
        .filter((t) => !ids?.length || ids.includes(t.id))
        .filter((t) => unlisted || !t.unlisted)
        .filter((t) => tagFilter(groups, t.group))
}
