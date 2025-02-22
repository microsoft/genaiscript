// Importing utility functions and constants from other files
import { logVerbose, strcmp } from "./util" // String comparison function
import { parsePromptScript } from "./template" // Function to parse scripts
import { readText } from "./fs" // Function to read text from a file
import { GENAI_ANYTS_REGEX } from "./constants" // Constants for MIME types and prefixes
import { Project } from "./server/messages"
import { resolveSystems } from "./systems"
import { resolveScriptParametersSchema } from "./vars"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { readdir } from "node:fs/promises"
import { uniq } from "es-toolkit"

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
    }
    const genaisrcDir = join(
        dirname(dirname(__filename ?? fileURLToPath(import.meta.url))),
        "genaisrc"
    ) // ignore esbuild warning
    const systemPrompts = await (
        await readdir(genaisrcDir)
    ).filter((f) => GENAI_ANYTS_REGEX.test(f))
    const promptFiles = uniq([...scriptFiles, ...systemPrompts])
    // Process each script file, parsing its content and updating the project
    for (const f of promptFiles) {
        const tmpl = await parsePromptScript(f, await readText(f))
        if (!tmpl) {
            logVerbose(`skipping invalid script file: ${f}`)
            continue
        } // Skip if no template is parsed
        prj.scripts.push(tmpl) // Add to project templates
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

    // compute systems
    prj.scripts
        .filter((s) => !s.isSystem)
        .forEach((s) => {
            s.resolvedSystem = resolveSystems(prj, s)
            s.inputSchema = resolveScriptParametersSchema(prj, s)
        })

    return prj // Return the fully parsed project
}
