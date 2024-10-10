import { uniq } from "es-toolkit"
import { Project } from "./ast"
import { arrayify } from "./util"

// Function to resolve and return a list of systems based on the provided script and project
// Analyzes script options and JavaScript source code to determine applicable systems.
export function resolveSystems(
    prj: Project,
    script: PromptSystemOptions & ModelOptions & { jsSource?: string }
) {
    const { jsSource } = script
    // Initialize systems array from script.system, converting to array if necessary using arrayify utility
    const systems = arrayify(script.system)
    const tools = arrayify(script.tools)

    // If no system is defined in the script, determine systems based on jsSource
    if (script.system === undefined) {
        // Check for schema definition in jsSource using regex
        const useSchema = /\Wdefschema\W/i.test(jsSource)

        // Default systems if no responseType is specified
        if (!script.responseType) {
            systems.push("system")
            systems.push("system.explanations")
        }

        if (tools.some((t) => /^agent/.test(t))) systems.push("system.planner")
        if (/\Wdefimages\W/i.test(jsSource))
            systems.push("system.safety_harmful_content")
        // Determine additional systems based on content of jsSource
        if (/\Wchangelog\W/i.test(jsSource)) systems.push("system.changelog")
        else if (/\Wfile\W/i.test(jsSource)) {
            systems.push("system.files")
            // Add file schema system if schema is used
            if (useSchema) systems.push("system.files_schema")
        }
        // Add schema system if schema is used
        if (useSchema) systems.push("system.schema")
        // Add annotation system if annotations, warnings, or errors are found
        if (/\W(annotation|warning|error)\W/i.test(jsSource))
            systems.push("system.annotations")
        // Add diagram system if diagrams or charts are found
        if (/\W(diagram|chart)\W/i.test(jsSource))
            systems.push("system.diagrams")
        if (/\W(git)\W/i.test(jsSource)) systems.push("system.git_info")
        if (/\W(github)\W/i.test(jsSource)) systems.push("system.github_info")
    }

    // Include tools-related systems if specified in the script
    if (tools.length) {
        systems.push("system.tools")
        // Resolve and add each tool's systems based on its definition in the project
        tools.forEach((tool) =>
            systems.push(...resolveSystemFromTools(prj, tool))
        )
    }

    // Return a unique list of non-empty systems
    // Filters out duplicates and empty entries using unique utility
    return uniq(systems.filter((s) => !!s))
}

// Helper function to resolve tools in the project and return their system IDs
// Finds systems in the project associated with a specific tool
function resolveSystemFromTools(prj: Project, tool: string): string[] {
    const system = prj.templates.filter(
        (t) => t.isSystem && t.defTools?.find((to) => to.id.startsWith(tool))
    )
    const res = system.map(({ id }) => id)
    return res
}

export function resolveTools(
    prj: Project,
    systems: string[],
    tools: string[]
): { id: string; description: string }[] {
    const { templates: scripts } = prj
    const toolScripts = uniq([
        ...systems.map((sid) => scripts.find((s) => s.id === sid)),
        ...tools.map((tid) =>
            scripts.find((s) => s.defTools?.find((t) => t.id.startsWith(tid)))
        ),
    ]).filter((s) => !!s)
    const res = toolScripts.map(({ defTools }) => defTools ?? []).flat()
    return res
}
