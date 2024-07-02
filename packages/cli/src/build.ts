import { GENAI_ANYJS_GLOB, host, parseProject } from "genaiscript-core"

export async function buildProject(options?: {
    toolFiles?: string[]
    toolsPath?: string
}) {
    const { toolFiles, toolsPath = GENAI_ANYJS_GLOB } = options || {}

    const scriptFiles = toolFiles?.length
        ? toolFiles
        : await host.findFiles(toolsPath)

    const newProject = await parseProject({
        scriptFiles,
    })
    return newProject
}
