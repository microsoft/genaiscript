import { buildProject } from "./build"
import { copyPrompt, createScript as coreCreateScript, fixPromptDefinitions } from "genaiscript-core"

export async function listScripts() {
    const prj = await buildProject()
    console.log("id, title, group, filename, system")
    prj.templates.forEach((t) =>
        console.log(
            `${t.id}, ${t.title}, ${t.group || ""}, ${t.filename || "builtin"}, ${t.isSystem ? "system" : "user"
            }`
        )
    )
}

export async function createScript(name: string) {
    const t = coreCreateScript(name)
    const pr = await copyPrompt(t, { fork: false, name })
    console.log(`create script at ${pr}`)
}

export async function compileScript() {
    const project = await buildProject()
    await fixPromptDefinitions(project)
}