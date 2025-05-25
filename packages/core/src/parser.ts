// Importing utility functions and constants from other files
import { logVerbose, logWarn, strcmp } from "./util" // String comparison function
import { parsePromptScript } from "./template" // Function to parse scripts
import { readText } from "./fs" // Function to read text from a file
import { GENAI_ANYTS_REGEX } from "./constants" // Constants for MIME types and prefixes
import { Project } from "./server/messages"
import { resolveSystems } from "./systems"
import { resolveScriptParametersSchema } from "./vars"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { readdir } from "node:fs/promises"
import { uniq } from "es-toolkit"
import { genaiscriptDebug } from "./debug"
const dbg = genaiscriptDebug("parser")

/**
 * Converts a string to a character position represented as [row, column].
 * Uses newline characters to calculate the row (number of newlines) and column (characters after the last newline).
 * If the string is empty, returns [0, 0].
 * @param str - The input string to convert.
 * @returns The position as [row, column].
 */
export function stringToPos(str: string): CharPosition {
    if (!str) return [0, 0] // Return default position if string is empty
    return [str.replace(/[^\n]/g, "").length, str.replace(/[^]*\n/, "").length]
}

/**
 * Parses a project based on the provided script files.
 * Initializes a project, reads system and user scripts, and updates with parsed templates.
 * Filters invalid or duplicate scripts and sorts templates.
 * Computes resolved systems and input schemas for non-system scripts.
 * @param options - Contains an array of script file paths to process.
 * @returns Project - The project with processed templates and diagnostics.
 */
export async function parseProject(options: { scriptFiles: string[] }) {
    const { scriptFiles } = options
    const genaisrcDir = resolve(
        join(
            dirname(dirname(__filename ?? fileURLToPath(import.meta.url))),
            "genaisrc"
        )
    ) // ignore esbuild warning
    dbg(`genaisrc: %s`, genaisrcDir)
    const prj: Project = {
        systemDir: genaisrcDir,
        scripts: [],
        diagnostics: [],
    }
    const systemPrompts = await (
        await readdir(genaisrcDir)
    ).filter((f) => GENAI_ANYTS_REGEX.test(f))
    dbg(`system prompts: %d`, systemPrompts.length)
    // Process each script file, parsing its content and updating the project
    const scripts: Record<string, PromptScript> = {}
    for (const fn of systemPrompts) {
        const f = join(genaisrcDir, fn)
        const tmpl = await parsePromptScript(f, await readText(f))
        if (!tmpl) {
            logWarn(`skipping invalid system script: ${fn}`)
            continue
        } // Skip if no template is parsed
        prj.scripts.push(tmpl) // Add to project templates
        scripts[tmpl.id] = tmpl
    }

    dbg(`user scripts: %d`, scriptFiles.length)
    for (const f of uniq(scriptFiles).filter(
        (f) => resolve(dirname(f)) !== genaisrcDir
    )) {
        const tmpl = await parsePromptScript(f, await readText(f))
        if (!tmpl) {
            logWarn(`skipping invalid script ${f}`)
            continue
        } // Skip if no template is parsed
        if (scripts[tmpl.id]) {
            logWarn(`duplicate script '${tmpl.id}' (${f})`)
            logVerbose(`  already defined in ${scripts[tmpl.id].filename}`)
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
