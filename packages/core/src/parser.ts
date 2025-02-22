// Importing utility functions and constants from other files
import { logVerbose, logWarn, strcmp } from "./util" // String comparison function
import { parsePromptScript } from "./template" // Function to parse scripts
import { readText } from "./fs" // Function to read text from a file
import { BUILTIN_SCRIPT_PREFIX, GENAI_ANYTS_REGEX } from "./constants" // Constants for MIME types and prefixes
import { Project } from "./server/messages"
import { resolveSystems } from "./systems"
import { resolveScriptParametersSchema } from "./vars"
import { dirname, join, resolve } from "node:path"
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
    const genaisrcDir = resolve(
        join(
            dirname(dirname(__filename ?? fileURLToPath(import.meta.url))),
            "genaisrc"
        )
    ) // ignore esbuild warning
    const systemPrompts = await (
        await readdir(genaisrcDir)
    ).filter((f) => GENAI_ANYTS_REGEX.test(f))
    // Process each script file, parsing its content and updating the project
    const scripts: Record<string, PromptScript> = {}
    for (const fn of systemPrompts) {
        const f = join(genaisrcDir, fn)
        const tmpl = await parsePromptScript(
            BUILTIN_SCRIPT_PREFIX + fn,
            await readText(f)
        )
        if (!tmpl) {
            logWarn(`skipping invalid system scruipt: ${fn}`)
            continue
        } // Skip if no template is parsed
        prj.scripts.push(tmpl) // Add to project templates
        scripts[tmpl.id] = tmpl
    }

    for (const f of uniq(scriptFiles).filter(
        (f) => resolve(dirname(f)) !== genaisrcDir
    )) {
        const tmpl = await parsePromptScript(f, await readText(f))
        if (!tmpl) {
            logWarn(`skipping invalid script ${f}`)
            continue
        } // Skip if no template is parsed
        if (scripts[tmpl.id]) {
            logWarn(`duplicate script ${tmpl.id} (${f})`)
            logVerbose(`  already defined in ${scripts[tmpl.id]}`)
            continue
        }
        prj.scripts.push(tmpl) // Add t
        scripts[tmpl.id] = tmpl
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
