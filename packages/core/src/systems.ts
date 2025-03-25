import debug from "debug"
const dbg = debug("genaiscript:systems")
const dbgr = debug("genaiscript:systems:resolve")

// cspell: disable
// This module resolves and returns a list of applicable systems based on the provided script and project.
// It analyzes script options and the JavaScript source code to determine which systems to include or exclude.

import { uniq } from "es-toolkit"
import { arrayify } from "./util"
import type { GenerationOptions } from "./generation"
import { isToolsSupported } from "./tools"
import type { Project } from "./server/messages"
import { deleteUndefinedValues } from "./cleaners"

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
    let systems = arrayify(script.system).filter((s) => typeof s === "string")
    const systemInstances = arrayify(script.system).filter(
        (s) => typeof s === "object"
    )

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
        // current date
        dbgr(`adding system.today to systems`)
        systems.push("system.today")
        // safety
        if (systemSafety !== false) {
            dbgr(`adding safeties to systems`)
            systems.push(...safeties)
        }
        // Check for schema definition in jsSource using regex
        const useSchema = /\Wdefschema\W/i.test(jsSource)

        // Default systems if no responseType is specified
        if (!dataMode) {
            dbgr(`adding default systems`)
            systems.push("system")
            systems.push("system.explanations")
            if (!responseType) {
                dbgr(`adding system.output_markdown`)
                systems.push("system.output_markdown")
            }
        }

        // Add planner system if any tool starts with "agent"
        if (tools.some((t) => /^agent/.test(t))) {
            dbgr(`tool starts with "agent", adding system.planner`)
            systems.push("system.planner")
        }
        // Add harmful content system if images are defined
        if (/\Wdefimages\W/i.test(jsSource)) {
            dbgr(`images found, adding system.safety_harmful_content`)
            systems.push("system.safety_harmful_content")
        }
        // Determine additional systems based on content of jsSource
        if (/\Wfile\W/i.test(jsSource)) {
            dbgr(`file references found, adding system.files`)
            systems.push("system.files")
            // Add file schema system if schema is used
            if (useSchema) {
                dbgr(`schema is used, adding system.files_schema`)
                systems.push("system.files_schema")
            }
        }
        if (/\Wchangelog\W/i.test(jsSource)) {
            dbgr(`changelog references found, adding system.changelog`)
            systems.push("system.changelog")
        }
        // Add schema system if schema is used
        if (useSchema) {
            dbgr(`schema is used, adding system.schema`)
            systems.push("system.schema")
        }
        // Add annotation system if annotations, warnings, or errors are found
        if (/\W(annotations|warnings|errors)\W/i.test(jsSource)) {
            dbgr(
                `annotations, warnings, or errors found, adding system.annotations`
            )
            systems.push("system.annotations")
        }
        // Add diagram system if diagrams or charts are found
        if (/\W(diagram|chart)\W/i.test(jsSource)) {
            dbgr(`diagrams or charts found, adding system.diagrams`)
            systems.push("system.diagrams")
        }
        // Add git information system if git is found
        if (/\W(git)\W/i.test(jsSource)) {
            dbgr(`git references found, adding system.git_info`)
            systems.push("system.git_info")
        }
        // Add GitHub information system if GitHub is found
        if (/\W(github)\W/i.test(jsSource)) {
            dbgr(`GitHub references found, adding system.github_info`)
            systems.push("system.github_info")
        }
    }

    // insert safety first
    if (systemSafety === "default") {
        dbgr(`inserting safety systems`)
        systems.unshift(...safeties)
    }

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
    if (responseSchema && !responseType) {
        dbgr(`adding system.output_json to match responseSchema`)
        systems.push("system.output_json")
    }

    // Include tools-related systems if specified in the script
    if (tools.length || resolvedTools?.length) {
        dbgr(`tools or resolvedTools found, adding system.tools`)
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
    systems = uniq(systems)

    // now compute system instances
    const res: SystemPromptInstance[] = [
        ...systems.map((id) => ({ id })),
        ...systemInstances,
    ]

    dbgr(`resolved %O`, res)

    return res
}

/**
 * Adds fallback tool systems to the provided systems array if applicable.
 * 
 * This function checks if any tools are available and if the system already 
 * contains a tool call identifier. If there are supported tools or fallback 
 * tools specified in the options or generation options, it adds a tool_calls 
 * system to the systems array.
 * 
 * @param systems - The array of system instances to which fallback tool systems 
 *                  may be added.
 * @param tools - The array of tool callbacks to evaluate for fallback systems.
 * @param options - Optional model options that may contain fallback tool 
 *                  specifications.
 * @param genOptions - Optional generation options that may include fallback tool 
 *                     configurations.
 * @returns A boolean indicating whether fallback tools were added or not.
 */
export function addFallbackToolSystems(
    systems: SystemPromptInstance[],
    tools: ToolCallback[],
    options?: ModelOptions,
    genOptions?: GenerationOptions
) {
    if (
        !tools?.length ||
        systems.find(({ id }) => id === "system.tool_calls")
    ) {
        dbg(`no tools or fallback tools found, skip fallback tools`)
        return false
    }

    const supported = isToolsSupported(options?.model || genOptions?.model)
    const fallbackTools =
        supported === false ||
        options?.fallbackTools ||
        genOptions?.fallbackTools
    if (fallbackTools) {
        dbg(
            `adding fallback tools to systems`,
            deleteUndefinedValues({
                supported,
                options: options?.fallbackTools,
                genOptions: genOptions?.fallbackTools,
            })
        )
        systems.push({ id: "system.tool_calls" })
    }
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
    systems: (string | SystemPromptInstance)[],
    tools: string[]
): { id: string; description: string }[] {
    const { scripts: scripts } = prj
    const toolScripts = uniq([
        ...systems.map((sys) =>
            scripts.find((s) =>
                typeof sys === "string" ? s.id === sys : false
            )
        ),
        ...tools.map((tid) =>
            scripts.find((s) => s.defTools?.find((t) => t.id.startsWith(tid)))
        ),
    ]).filter((s) => !!s)
    const res = toolScripts.map(({ defTools }) => defTools ?? []).flat()
    return res
}
