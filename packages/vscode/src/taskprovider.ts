import * as vscode from "vscode"
import { ExtensionState } from "./state"
import { resolveCli } from "./config"
import { TOOL_ID } from "../../core/src/constants"
import { quoteify } from "../../core/src/util"

export async function activeTaskProvider(state: ExtensionState) {
    const { context, host } = state
    const { subscriptions } = context

    const taskProvider: vscode.TaskProvider = {
        provideTasks: async () => {
            const { cliPath, cliVersion } = await resolveCli()
            const exec = cliPath
                ? quoteify(cliPath)
                : `npx --yes genaiscript@${cliVersion}`
            const scripts = state.project.templates.filter((t) => !t.isSystem)
            const tasks = scripts.map((script) => {
                const scriptName = host.path.relative(
                    host.projectFolder(),
                    script.filename
                )
                const task = new vscode.Task(
                    { type: TOOL_ID, script: script.filename },
                    vscode.TaskScope.Workspace,
                    script.id,
                    TOOL_ID,
                    new vscode.ShellExecution(exec, [
                        "run",
                        scriptName,
                        "${relativeFile}",
                    ])
                )
                task.detail = `${script.title ?? script.description} - ${scriptName}`
                task.problemMatchers = ["$eslint-compact"]
                task.presentationOptions = {
                    echo: true,
                    focus: true,
                    showReuseMessage: false,
                    clear: true,
                }
                return task
            })
            return tasks
        },
        async resolveTask(task): Promise<vscode.Task> {
            return task
        },
    }

    subscriptions.push(vscode.tasks.registerTaskProvider(TOOL_ID, taskProvider))
}
