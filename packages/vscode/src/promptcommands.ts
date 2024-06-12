import * as vscode from "vscode"
import { ExtensionState } from "./state"
import { PromptScript, copyPrompt, createScript } from "genaiscript-core"
import { builtinPromptUri } from "./markdowndocumentprovider"
import { templatesToQuickPickItems } from "./fragmentcommands"

export function activatePromptCommands(state: ExtensionState) {
    const { context, host } = state
    const { subscriptions } = context

    async function showPrompt(fn: string) {
        await state.fixPromptDefinitions()
        vscode.window.showTextDocument(host.toUri(fn))
        await state.parseWorkspace()
    }

    subscriptions.push(
        vscode.commands.registerCommand("genaiscript.newfile.script", () =>
            vscode.commands.executeCommand("genaiscript.prompt.create")
        ),
        vscode.commands.registerCommand(
            "genaiscript.prompt.refresh",
            async () => {
                await state.parseWorkspace()
            }
        ),
        vscode.commands.registerCommand(
            "genaiscript.prompt.create",
            async (template?: PromptScript) => {
                const name = await vscode.window.showInputBox({
                    title: "Pick a file name for the new GenAiScript.",
                })
                if (name === undefined) return
                const t = createScript(name, { template })
                const pr = await copyPrompt(t, { fork: false, name })
                await showPrompt(pr)
            }
        ),
        vscode.commands.registerCommand(
            "genaiscript.prompt.fork",
            async (template: PromptScript) => {
                if (!template) {
                    if (!state.project) await state.parseWorkspace()
                    const templates = state.project?.templates
                    if (!templates?.length) return
                    const picked = await vscode.window.showQuickPick(
                        templatesToQuickPickItems(templates),
                        {
                            title: `Pick a GenAiScript to fork`,
                        }
                    )
                    if (picked === undefined) return
                    template = picked.template
                }
                const name = await vscode.window.showInputBox({
                    title: `Pick a file name for the new GenAIScript script.`,
                    value: template.id,
                })
                if (name === undefined) return
                await showPrompt(
                    await copyPrompt(template, { fork: true, name })
                )
            }
        ),
        vscode.commands.registerCommand(
            "genaiscript.prompt.unbuiltin",
            async (template: PromptScript) => {
                if (!template) return
                await showPrompt(await copyPrompt(template, { fork: false }))
            }
        ),
        vscode.commands.registerCommand(
            "genaiscript.prompt.navigate",
            async (prompt: PromptScript) => {
                const uri = prompt.filename
                    ? host.toUri(prompt.filename)
                    : builtinPromptUri(prompt.id)
                await vscode.window.showTextDocument(uri)
            }
        )
    )
}

export function commandButtons(state: ExtensionState) {
    const request = state.aiRequest
    const { computing } = request || {}
    const abort = "Abort"
    const output = "Output"
    const trace = "Trace"
    const cmds: { label: string; description?: string; cmd: string }[] = []
    if (computing) cmds.push({ label: abort, cmd: "genaiscript.request.abort" })
    if (request) {
        cmds.push({
            label: output,
            description: "Preview AI response.",
            cmd: "genaiscript.request.open.output",
        })
        cmds.push({
            label: trace,
            description: "Inspect script execution and LLM response.",
            cmd: "genaiscript.request.open.trace",
        })
    }

    return cmds
}

export function commandButtonsMarkdown(state: ExtensionState, sep = " | ") {
    const res = commandButtons(state)
        .map(({ label, description, cmd }) => `[${label}](command:${cmd})`)
        .join(sep)
    return res
}
