import { uniq } from "es-toolkit"
import { GENAI_ANY_REGEX, GENAI_ANYJS_GLOB } from "../../core/src/constants"
import { host, runtimeHost } from "../../core/src/host"
import { parseProject } from "../../core/src/parser"
import { arrayify } from "../../core/src/util"

/**
 * Asynchronously builds a project by parsing tool files.
 *
 * @param options - Optional configuration for building the project.
 * @param options.toolFiles - Specific tool files to include in the build.
 * @param options.toolsPath - Path to search for tool files if none are provided.
 * @returns A promise that resolves to the new project structure.
 */
export async function buildProject(options?: {
    toolFiles?: string[]
    toolsPath?: string | string[]
}) {
    const { toolFiles, toolsPath } = options || {}
    let scriptFiles: string[] = []
    if (toolFiles?.length) {
        scriptFiles = toolFiles
    } else {
        let tps = toolsPath
        if (!tps?.length) {
            tps = [GENAI_ANYJS_GLOB, ...arrayify(runtimeHost.config.include)]
        }
        tps = arrayify(tps)
        scriptFiles = []
        for (const tp of tps) {
            const fs = await host.findFiles(tp)
            scriptFiles.push(...fs)
        }
    }

    // filter out unwanted files
    scriptFiles = scriptFiles.filter((f) => GENAI_ANY_REGEX.test(f))

    // Ensure that the script files are unique
    scriptFiles = uniq(scriptFiles)

    // Parse the project using the determined script files
    const newProject = await parseProject({
        scriptFiles,
    })

    // Return the newly parsed project structure
    return newProject
}
