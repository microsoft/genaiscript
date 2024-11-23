/// <reference path="./types/prompt_template.d.ts" />
// Import necessary regular expressions for file type detection and host utilities
import {
    GENAI_ANYJS_REGEX,
    GENAI_ANYTS_REGEX,
    PROMPTY_REGEX,
} from "./constants"
import { host } from "./host"

// Interface representing a file reference, with a name and filename property
export interface FileReference {
    name: string
    filename: string
}

/**
 * Converts diagnostic information to a CSV format string.
 * @param diagnostics - An array of Diagnostic objects, each containing severity, filename, range, etc.
 * @param sep - The separator used to delimit CSV fields, such as a comma.
 * @returns A string representing the diagnostics in CSV format, each entry separated by a newline.
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
 * Determines the group of a given template.
 * @param template - A PromptScript object containing the template details.
 * @returns The group name associated with the template, defaulting to "unassigned" if no group is set.
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
 * Groups templates by their directory and determines if JS or TS files are present.
 * Useful for organizing templates based on their file type.
 * @returns An array of folder information objects, each containing directory name and file type presence.
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
 * Retrieves a template by its ID.
 * @param id - The ID of the template to retrieve.
 * @returns The matching PromptScript or undefined if no match is found.
 */
export function resolveScript(prj: Project, id: string) {
    return prj?.scripts?.find((t) => t.id == id) // Find and return the template with the matching ID
}

/**
 * Represents a project containing templates and diagnostics.
 * Provides utility methods to manage templates and diagnose issues.
 */
export interface Project {
    scripts: PromptScript[] // Array of templates within the project
    diagnostics: Diagnostic[] // Array of diagnostic records
}
