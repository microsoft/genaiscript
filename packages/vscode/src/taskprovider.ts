import * as vscode from "vscode"
import { ExtensionState } from "./state"
import { resolveCli } from "./config"
import { TOOL_ID } from "../../core/src/constants"
import { shellQuote } from "../../core/src/shell"

export async function activeTaskProvider(state: ExtensionState) {
    const { context, host } = state
    const { subscriptions } = context

    const taskProvider: vscode.TaskProvider = {
        provideTasks: async () => {
            try {
                if (!state.project) return []

                const { cliPath, cliVersion } = await resolveCli()
                const exec = shellQuote([cliPath || `npx`])
                const exeArgs = cliPath
                    ? []
                    : ["--yes", `genaiscript@${cliVersion}`]
                const scripts = state.project.scripts.filter(
                    (t) => !t.isSystem && t.group !== "infrastructure"
                )
                const tasks = scripts.map((script) => {
                    const scriptName = host.path.relative(
                        host.projectFolder(),
                        script.filename
                    )
                    const args = [...exeArgs, "run", scriptName]
                    if (vscode.window.activeTextEditor)
                        args.push("${relativeFile}")
                    const task = new vscode.Task(
                        { type: TOOL_ID, script: script.filename },
                        vscode.TaskScope.Workspace,
                        script.id,
                        TOOL_ID,
                        new vscode.ShellExecution(exec, args)
                    )
                    task.detail = `${script.title ?? script.description} - ${scriptName}`
                    task.problemMatchers = [
                        "$genaiscript",
                        "$eslint-compact",
                        "$tsc",
                        "$msCompile",
                        "$lessCompile",
                        "$jshint",
                    ]
                    task.presentationOptions = {
                        echo: true,
                        focus: true,
                        showReuseMessage: false,
                        clear: true,
                    }
                    return task
                })
                return tasks
            } catch (e) {
                vscode.window.showErrorMessage(`${TOOL_ID} - ${e.message}`)
                return []
            }
        },
        async resolveTask(task): Promise<vscode.Task> {
            return task
        },
    }

    subscriptions.push(vscode.tasks.registerTaskProvider(TOOL_ID, taskProvider))
}
