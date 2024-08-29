import { buildProject } from "./build"
import { TYPESCRIPT_VERSION } from "./version"
import { copyPrompt } from "../../core/src/copy"
import {
    fixPromptDefinitions,
    createScript as coreCreateScript,
} from "../../core/src/scripts"
import { logError, logInfo, logVerbose } from "../../core/src/util"
import { runtimeHost } from "../../core/src/host"
import { RUNTIME_ERROR_CODE } from "../../core/src/constants"

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

    let errors = 0
    for (const folder of foldersToCompile) {
        const { dirname, js, ts } = folder
        if (js) {
            logInfo(`compiling ${dirname}/*.js`)
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
            if (res.stderr) logInfo(res.stderr)
            if (res.stdout) logVerbose(res.stdout)
            if (res.exitCode) errors++
        }
        if (ts) {
            logInfo(`compiling ${dirname}/*.{mjs,.mts}`)
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
            if (res.stderr) logInfo(res.stderr)
            if (res.stdout) logVerbose(res.stdout)
            if (res.exitCode) errors++
        }
    }

    if (errors) process.exit(RUNTIME_ERROR_CODE)
}
