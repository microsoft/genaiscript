import { buildProject } from "./build"
import { TYPESCRIPT_VERSION } from "./version"
import { copyPrompt } from "../../core/src/copy"
import {
    fixPromptDefinitions,
    createScript as coreCreateScript,
} from "../../core/src/scripts"
import { logVerbose } from "../../core/src/util"
import { runtimeHost } from "../../core/src/host"

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
    await compileScript([])
}

export async function fixScripts() {
    const project = await buildProject()
    await fixPromptDefinitions(project)
}

export async function compileScript(folders: string[]) {
    const project = await buildProject()
    await fixPromptDefinitions(project)
    const scriptFolders = project.folders()
    const foldersToCompile = (
        folders?.length ? folders : project.folders().map((f) => f.dirname)
    )
        .map((f) => scriptFolders.find((sf) => sf.dirname === f))
        .filter((f) => f)

    for (const folder of foldersToCompile) {
        const { dirname, js, ts } = folder
        logVerbose(`compiling ${dirname}`)
        if (js) {
            const res = await runtimeHost.exec(
                undefined,
                "npx",
                [
                    "--yes",
                    "--package",
                    `typescript@${TYPESCRIPT_VERSION}`,
                    "tsc",
                    "--project",
                    runtimeHost.path.resolve(dirname, "jsconfig.json"),
                ],
                {
                    cwd: dirname,
                }
            )
            logVerbose(res.output)
        }
        if (ts) {
            const res = await runtimeHost.exec(
                undefined,
                "npx",
                [
                    "--yes",
                    "--package",
                    `typescript@${TYPESCRIPT_VERSION}`,
                    "tsc",
                    "--project",
                    runtimeHost.path.resolve(dirname, "tsconfig.json"),
                ],
                {
                    cwd: dirname,
                }
            )
            logVerbose(res.output)
        }
    }
}
