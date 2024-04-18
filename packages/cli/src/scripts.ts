import { buildProject } from "./build"
import { copyPrompt, createScript as coreCreateScript, exec, fixPromptDefinitions, host, logVerbose } from "genaiscript-core"
import { TYPESCRIPT_VERSION } from "./version"

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
    console.log(`created script at ${pr}`)
    await compileScript()
}

export async function compileScript() {
    const project = await buildProject()
    await fixPromptDefinitions(project)
    for (const folder of project.folders()) {
        logVerbose(`compiling ${folder}/*.genai.js`)
        const res = await exec(host, {
            label: folder,
            call: {
                type: "shell",
                cwd: folder,
                command: "npx",
                args: ["-c", "tsc --project jsconfig.json"]
            }
        })
    }
}