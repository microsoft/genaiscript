import { Project } from "./ast"
import { arrayify, unique } from "./util"

export function resolveSystems(
    prj: Project,
    script: PromptSystemOptions & ModelOptions & { jsSource?: string }
) {
    const { jsSource } = script
    const systems = arrayify(script.system).slice(0)

    if (script.system === undefined) {
        const useSchema = /\Wdefschema\W/i.test(jsSource)
        if (!script.responseType) {
            systems.push("system")
            systems.push("system.explanations")
        }
        // select file expansion type
        if (/\Wdiff\W/i.test(jsSource)) systems.push("system.diff")
        else if (/\Wchangelog\W/i.test(jsSource))
            systems.push("system.changelog")
        else if (/\Wfile\W/i.test(jsSource)) {
            systems.push("system.files")
            if (useSchema) systems.push("system.files_schema")
        }
        if (useSchema) systems.push("system.schema")
        if (/\W(annotation|warning|error)\W/i.test(jsSource))
            systems.push("system.annotations")
        if (/\W(diagram|chart)\W/i.test(jsSource))
            systems.push("system.diagrams")
    }

    if (script.tools) {
        systems.push("system.tools")
        arrayify(script.tools).forEach((tool) =>
            systems.push(...resolveTools(prj, tool))
        )
    }

    return unique(systems.filter((s) => !!s))
}

function resolveTools(prj: Project, tool: string): string[] {
    const toolsRx = new RegExp(`defTool\\s*\\(\\s*('|"|\`)${tool}`)
    const system = prj.templates.filter(
        (t) => t.isSystem && toolsRx.test(t.jsSource)
    )
    return system.map(({ id }) => id)
}
