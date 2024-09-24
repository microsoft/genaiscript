import { Project } from "./ast"
import { arrayify, unique } from "./util"

// Function to resolve and return a list of systems based on the provided script and project
// Analyzes script options and JavaScript source code to determine applicable systems.
export function resolveSystems(
    prj: Project,
    script: PromptSystemOptions & ModelOptions & { jsSource?: string }
) {
    const { jsSource } = script
    // Initialize systems array from script.system, converting to array if necessary using arrayify utility
    const systems = arrayify(script.system).slice(0)

    // If no system is defined in the script, determine systems based on jsSource
    if (script.system === undefined) {
        // Check for schema definition in jsSource using regex
        const useSchema = /\Wdefschema\W/i.test(jsSource)

        // Default systems if no responseType is specified
        if (!script.responseType) {
            systems.push("system")
            systems.push("system.explanations")
        }

        // Determine additional systems based on content of jsSource
        // Check for specific keywords in jsSource to decide which systems to add
        if (/\Wdiff\W/i.test(jsSource)) systems.push("system.diff")
        else if (/\Wchangelog\W/i.test(jsSource))
            systems.push("system.changelog")
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
    }

    // Include tools-related systems if specified in the script
    if (script.tools) {
        systems.push("system.tools")
        // Resolve and add each tool's systems based on its definition in the project
        arrayify(script.tools).forEach((tool) =>
            systems.push(...resolveTools(prj, tool))
        )
    }

    // Return a unique list of non-empty systems
    // Filters out duplicates and empty entries using unique utility
    return unique(systems.filter((s) => !!s))
}

// Helper function to resolve tools in the project and return their system IDs
// Finds systems in the project associated with a specific tool
function resolveTools(prj: Project, tool: string): string[] {
    // Create regular expression to match tool definition in jsSource
    const toolsRx = new RegExp(`defTool\\s*\\(\\s*('|"|\`)${tool}`)

    // Filter project templates to find matching systems that define the tool
    const system = prj.templates.filter(
        (t) => t.isSystem && toolsRx.test(t.jsSource)
    )

    // Return the IDs of matched systems
    return system.map(({ id }) => id)
}
