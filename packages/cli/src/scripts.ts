import { buildProject } from "./build"
import {
    copyPrompt,
    createScript as coreCreateScript,
    fixPromptDefinitions,
    GENAI_ANYTS_REGEX,
    GENAI_JS_EXT,
    host,
    logVerbose,
} from "genaiscript-core"
import { TYPESCRIPT_VERSION } from "./version"
import { readdir } from "node:fs/promises"

export async function listScripts() {
    const prj = await buildProject()
    console.log("id, title, group, filename, system")
    prj.templates.forEach((t) =>
        console.log(
            `${t.id}, ${t.title}, ${t.group || ""}, ${t.filename || "builtin"}, ${
                t.isSystem ? "system" : "user"
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

export async function fixScripts() {
    const project = await buildProject()
    await fixPromptDefinitions(project)
}

export async function compileScript() {
    const project = await buildProject()
    await fixPromptDefinitions(project)
    for (const folder of project.folders()) {
        logVerbose(`compiling ${folder}`)
        const files = await readdir(folder)
        if (files.some((f) => f.endsWith(GENAI_JS_EXT))) {
            const res = await host.exec(
                undefined,
                "npx",
                [
                    "--yes",
                    "--package",
                    `typescript@${TYPESCRIPT_VERSION}`,
                    "tsc",
                    "--project",
                    host.path.resolve(folder, "jsconfig.json"),
                ],
                {
                    cwd: folder,
                }
            )
            logVerbose(res.output)
        }
        if (files.some((f) => GENAI_ANYTS_REGEX.test(f))) {
            const res = await host.exec(
                undefined,
                "npx",
                [
                    "--yes",
                    "--package",
                    `typescript@${TYPESCRIPT_VERSION}`,
                    "tsc",
                    "--project",
                    host.path.resolve(folder, "tsconfig.json"),
                ],
                {
                    cwd: folder,
                }
            )
            logVerbose(res.output)
        }
    }
}
