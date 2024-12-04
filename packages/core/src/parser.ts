// Importing utility functions and constants from other files
import { logVerbose, strcmp } from "./util" // String comparison function
import { defaultPrompts } from "./default_prompts" // Default prompt data
import { parsePromptScript } from "./template" // Function to parse scripts
import { readText } from "./fs" // Function to read text from a file
import {
    BUILTIN_PREFIX,
    DOCX_MIME_TYPE,
    PDF_MIME_TYPE,
    XLSX_MIME_TYPE,
} from "./constants" // Constants for MIME types and prefixes
import { diag } from "mathjs"
import { Project } from "./server/messages"

/**
 * Converts a string to a character position represented as [row, column].
 * Utilizes newline characters to determine row and column.
 * @param str - The input string to convert.
 * @returns CharPosition - The position as a tuple of row and column.
 */
export function stringToPos(str: string): CharPosition {
    if (!str) return [0, 0] // Return default position if string is empty
    return [str.replace(/[^\n]/g, "").length, str.replace(/[^]*\n/, "").length]
}

/**
 * Determines if a given MIME type is binary.
 * Checks against common and additional specified binary types.
 * @param mimeType - The MIME type to check.
 * @returns boolean - True if the MIME type is binary, otherwise false.
 */
export function isBinaryMimeType(mimeType: string) {
    return (
        /^(image|audio|video)\//.test(mimeType) || // Common binary types
        BINARY_MIME_TYPES.includes(mimeType) // Additional specified binary types
    )
}

// List of known binary MIME types
const BINARY_MIME_TYPES = [
    // Documents
    PDF_MIME_TYPE,
    "application/msword",
    "application/vnd.ms-excel",
    "application/vnd.ms-powerpoint",
    DOCX_MIME_TYPE, // .docx
    XLSX_MIME_TYPE, // .xlsx
    "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx

    // Archives
    "application/zip",
    "application/x-rar-compressed",
    "application/x-7z-compressed",
    "application/x-tar",
    "application/x-bzip",
    "application/x-bzip2",
    "application/x-gzip",

    // Executables and binaries
    "application/octet-stream", // General binary type (often default for unknown binary files)
    "application/x-msdownload", // Executables
    "application/x-shockwave-flash", // SWF
    "application/java-archive", // JAR (Java)

    // Others
    "application/vnd.google-earth.kml+xml", // KML (though XML based, often treated as binary in context of HTTP)
    "application/vnd.android.package-archive", // APK (Android package)
    "application/x-iso9660-image", // ISO images
    "application/vnd.apple.installer+xml", // Apple Installer Package (though XML, often handled as binary)
]

/**
 * Parses a project based on provided script files.
 * Initializes a project, reads scripts, and updates with parsed templates.
 * @param options - An object containing an array of script files.
 * @returns Project - The parsed project with templates.
 */
export async function parseProject(options: { scriptFiles: string[] }) {
    const { scriptFiles } = options
    const prj: Project = {
        scripts: [],
        diagnostics: [],
    } // Initialize a new project instance

    // Clone the default prompts
    const deflPr: Record<string, string> = Object.assign({}, defaultPrompts)

    // Process each script file, parsing its content and updating the project
    for (const f of scriptFiles) {
        const tmpl = await parsePromptScript(f, await readText(f), prj)
        if (!tmpl) {
            logVerbose(`skipping invalid script file: ${f}`)
            continue
        } // Skip if no template is parsed
        delete deflPr[tmpl.id] // Remove the parsed template from defaults
        prj.scripts.push(tmpl) // Add to project templates
    }

    // Add remaining default prompts to the project
    for (const [id, v] of Object.entries(deflPr)) {
        prj.scripts.push(await parsePromptScript(BUILTIN_PREFIX + id, v, prj))
    }

    /**
     * Generates a sorting key for a PromptScript
     * Determines priority based on whether a script is unlisted or has a filename.
     * @param t - The PromptScript to generate the key for.
     * @returns string - The sorting key.
     */
    function templKey(t: PromptScript) {
        const pref = t.unlisted ? "Z" : t.filename ? "A" : "B" // Determine prefix for sorting
        return pref + t.title + t.id // Concatenate for final sorting key
    }

    // Sort templates by the generated key
    prj.scripts.sort((a, b) => strcmp(templKey(a), templKey(b)))

    return prj // Return the fully parsed project
}
