import { Project } from "./ast"
import { unique } from "./util"

export function resolveSystems(prj: Project, template: PromptScript) {
    const { jsSource } = template
    const systems = Array.from(template.system ?? []).slice(0)

    if (template.system === undefined) {
        const useSchema = /\Wdefschema\W/i.test(jsSource)
        if (!template.responseType) {
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

    if (template.tools?.length)
        template.tools.forEach((tool) => systems.push(resolveTool(prj, tool)))

    return unique(systems.filter((s) => !!s))
}

function resolveTool(prj: Project, tool: string) {
    const toolsRx = new RegExp(`defTool\\s*\\(\\s*('|"|\`)${tool}('|"|\`)`)
    const system = prj.templates.find(
        (t) => t.isSystem && toolsRx.test(t.jsSource)
    )
    return system.id
}
