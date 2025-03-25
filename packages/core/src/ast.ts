/// <reference path="./types/prompt_template.d.ts" />
// Import necessary regular expressions for file type detection and host utilities
import {
    GENAI_ANYJS_REGEX,
    GENAI_ANYTS_REGEX,
    PROMPTY_REGEX,
} from "./constants"
import { host } from "./host"
import { Project } from "./server/messages"
import { arrayify } from "./cleaners"
import { tagFilter } from "./tags"

// Interface representing a file reference, with a name and filename property
export interface FileReference {
    name: string
    filename: string
}

/**
 * Converts diagnostic data into a CSV-formatted string.
 * @param diagnostics - Array of diagnostic objects with severity, filename, range, code, and message.
 * @param sep - Separator for CSV fields.
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
 * Determines the group name of a given template.
 * @param template - The template object to evaluate.
 * @returns Group name of the template, "system" if the ID starts with "system", 
 * or "unassigned" if no group is set.
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
 * Organizes templates by directory and identifies the presence of JS or TS files in each directory.
 * @param prj - The project containing the scripts to process.
 * @returns An array of objects, each representing a directory with its name and boolean flags for JS and TS file presence.
 */
export function collectFolders(prj: Project) {
    const folders: Record<
        string,
        { dirname: string; js?: boolean; ts?: boolean }
    > = {}
    for (const t of Object.values(prj.scripts).filter(
        // must have a filename and not propmty
        (t) => t.filename && !PROMPTY_REGEX.test(t.filename)
    )) {
        const dirname = host.path.dirname(t.filename) // Get directory name from the filename
        const folder = folders[dirname] || (folders[dirname] = { dirname })
        folder.js = folder.js || GENAI_ANYJS_REGEX.test(t.filename) // Check for presence of JS files
        folder.ts = folder.ts || GENAI_ANYTS_REGEX.test(t.filename) // Check for presence of TS files
    }
    return Object.values(folders) // Return an array of folders with their properties
}

/**
 * Retrieves a script by its ID from the project's scripts list.
 * @param prj - The project containing the scripts.
 * @param system - The system prompt instance with the script ID to find.
 * @returns The matching PromptScript or undefined if no match is found.
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
