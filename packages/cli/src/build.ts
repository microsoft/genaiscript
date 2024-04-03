import {
    GENAI_JS_GLOB,
    GPSPEC_GLOB,
    host,
    parseProject,
} from "genaiscript-core"

export async function buildProject(options?: {
    toolFiles?: string[]
    specFiles?: string[]
    toolsPath?: string
    specsPath?: string
}) {
    const {
        toolFiles,
        specFiles,
        toolsPath = GENAI_JS_GLOB,
        specsPath = GPSPEC_GLOB,
    } = options || {}

    const gpspecFiles = specFiles?.length
        ? specFiles
        : await host.findFiles(specsPath)
    const scriptFiles = toolFiles?.length
        ? toolFiles
        : await host.findFiles(toolsPath)

    const newProject = await parseProject({
        gpspecFiles,
        scriptFiles,
    })
    return newProject
}
