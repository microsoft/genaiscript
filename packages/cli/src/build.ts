import { GENAI_ANYJS_GLOB } from "../../core/src/constants"
import { host } from "../../core/src/host"
import { parseProject } from "../../core/src/parser"

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
    toolsPath?: string
}) {
    // Destructure options with a default value for toolsPath
    const { toolFiles, toolsPath = GENAI_ANYJS_GLOB } = options || {}

    // Determine script files to use: either provided or found at the toolsPath
    const scriptFiles = toolFiles?.length
        ? toolFiles // Use provided tool files if available
        : await host.findFiles(toolsPath) // Otherwise, find files at the specified toolsPath

    // Parse the project using the determined script files
    const newProject = await parseProject({
        scriptFiles,
    })

    // Return the newly parsed project structure
    return newProject
}
