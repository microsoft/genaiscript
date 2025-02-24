// cspell: disable
// This module resolves and returns a list of applicable systems based on the provided script and project.
// It analyzes script options and the JavaScript source code to determine which systems to include or exclude.

import { uniq } from "es-toolkit"
import { arrayify } from "./util"
import type { GenerationOptions } from "./generation"
import { isToolsSupported } from "./tools"
import type { Project } from "./server/messages"

/**
 * Function to resolve and return a list of systems based on the provided script and project.
 * This function analyzes the script options and JavaScript source code to determine applicable systems.
 *
 * @param prj - The project object containing templates and other project-related data.
 * @param script - An object containing options for the prompt system, model options, and optionally JavaScript source code.
 * @returns An array of unique system IDs that are applicable based on the analysis.
 */
export function resolveSystems(
    prj: Project,
    script: PromptSystemOptions &
        ModelOptions &
        ContentSafetyOptions & { jsSource?: string },
    resolvedTools?: ToolCallback[]
): SystemPromptInstance[] {
    const { jsSource, responseType, responseSchema, systemSafety } = script
    // Initialize systems array from script.system, converting to array if necessary using arrayify utility
    let systems = arrayify(script.system)
    const excludedSystem = arrayify(script.excludedSystem)
    const tools = arrayify(script.tools)
    const dataMode =
        responseSchema ||
        (responseType && responseType !== "markdown" && responseType !== "text")
    const safeties = [
        "system.safety_jailbreak",
        "system.safety_harmful_content",
        "system.safety_protected_material",
    ]

    // If no system is defined in the script, determine systems based on jsSource
    if (script.system === undefined) {
        // safety
        if (systemSafety !== false) systems.push(...safeties)
        // Check for schema definition in jsSource using regex
        const useSchema = /\Wdefschema\W/i.test(jsSource)

        // Default systems if no responseType is specified
        if (!dataMode) {
            systems.push("system")
            systems.push("system.explanations")
            if (!responseType) systems.push("system.output_markdown")
        }

        // Add planner system if any tool starts with "agent"
        if (tools.some((t) => /^agent/.test(t))) systems.push("system.planner")
        // Add harmful content system if images are defined
        if (/\Wdefimages\W/i.test(jsSource))
            systems.push("system.safety_harmful_content")
        // Determine additional systems based on content of jsSource
        if (/\Wfile\W/i.test(jsSource)) {
            systems.push("system.files")
            // Add file schema system if schema is used
            if (useSchema) systems.push("system.files_schema")
        }
        if (/\Wchangelog\W/i.test(jsSource)) systems.push("system.changelog")
        // Add schema system if schema is used
        if (useSchema) systems.push("system.schema")
        // Add annotation system if annotations, warnings, or errors are found
        if (/\W(annotations|warnings|errors)\W/i.test(jsSource))
            systems.push("system.annotations")
        // Add diagram system if diagrams or charts are found
        if (/\W(diagram|chart)\W/i.test(jsSource))
            systems.push("system.diagrams")
        // Add git information system if git is found
        if (/\W(git)\W/i.test(jsSource)) systems.push("system.git_info")
        // Add GitHub information system if GitHub is found
        if (/\W(github)\W/i.test(jsSource)) systems.push("system.github_info")
    }

    // insert safety first
    if (systemSafety === "default") systems.unshift(...safeties)

    // output format
    switch (responseType) {
        case "markdown":
            systems.push("system.output_markdown")
            break
        case "text":
            systems.push("system.output_plaintext")
            break
        case "json":
        case "json_object":
        case "json_schema":
            systems.push("system.output_json")
            break
        case "yaml":
            systems.push("system.output_yaml")
            break
    }
    if (responseSchema && !responseType) systems.push("system.output_json")

    // Include tools-related systems if specified in the script
    if (tools.length || resolvedTools?.length) {
        systems.push("system.tools")
        // Resolve and add each tool's systems based on its definition in the project
        tools.forEach((tool) =>
            systems.push(...resolveSystemFromTools(prj, tool))
        )
    }

    // filter out
    systems = systems
        .filter((s) => !!s)
        .filter((s) => !excludedSystem.includes(s))

    // Return a unique list of non-empty systems
    // Filters out duplicates and empty entries using unique utility
    const res = uniq(systems)

    // now compute system instances
    const systemInstances: SystemPromptInstance[] = [
        ...res.map((id) => ({ id })),
        ...arrayify(script.systemInstances),
    ]

    return systemInstances
}

export function addFallbackToolSystems(
    systems: SystemPromptInstance[],
    tools: ToolCallback[],
    options?: ModelOptions,
    genOptions?: GenerationOptions
) {
    if (!tools?.length || systems.find(({ id }) => id === "system.tool_calls"))
        return false

    const fallbackTools =
        isToolsSupported(options?.model || genOptions?.model) === false ||
        options?.fallbackTools ||
        genOptions?.fallbackTools
    if (fallbackTools) systems.push({ id: "system.tool_calls" })
    return fallbackTools
}

/**
 * Helper function to resolve tools in the project and return their system IDs.
 * Finds systems in the project associated with a specific tool.
 *
 * @param prj - The project object containing templates and other project-related data.
 * @param tool - The tool ID to resolve systems for.
 * @returns An array of system IDs associated with the specified tool.
 */
function resolveSystemFromTools(prj: Project, tool: string): string[] {
    const system = prj.scripts.filter(
        (t) => t.isSystem && t.defTools?.find((to) => to.id.startsWith(tool))
    )
    const res = system.map(({ id }) => id)

    return res
}

/**
 * Function to resolve tools in the project based on provided systems and tools.
 * This function returns a list of tool objects with their IDs and descriptions.
 *
 * @param prj - The project object containing templates and other project-related data.
 * @param systems - An array of system IDs to resolve tools for.
 * @param tools - An array of tool IDs to resolve tools for.
 * @returns An array of tool objects containing their IDs and descriptions.
 */
export function resolveTools(
    prj: Project,
    systems: string[],
    tools: string[]
): { id: string; description: string }[] {
    const { scripts: scripts } = prj
    const toolScripts = uniq([
        ...systems.map((sid) => scripts.find((s) => s.id === sid)),
        ...tools.map((tid) =>
            scripts.find((s) => s.defTools?.find((t) => t.id.startsWith(tid)))
        ),
    ]).filter((s) => !!s)
    const res = toolScripts.map(({ defTools }) => defTools ?? []).flat()
    return res
}
