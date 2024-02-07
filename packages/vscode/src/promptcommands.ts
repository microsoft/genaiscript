import * as vscode from "vscode"
import { Utils } from "vscode-uri"
import { ExtensionState } from "./state"
import { PromptTemplate, copyPrompt } from "genaiscript-core"
import { builtinPromptUri } from "./markdowndocumentprovider"
import { templatesToQuickPickItems } from "./fragmentcommands"

const TEMPLATE = `# New specification
    
Description of the spec.
`

export function activatePromptCommands(state: ExtensionState) {
    const { context } = state
    const { subscriptions } = context

    async function showPrompt(fn: string) {
        await state.parseWorkspace()
        await vscode.window.showTextDocument(vscode.Uri.file(fn))
    }

    subscriptions.push(
        vscode.commands.registerCommand("coarch.newfile.gptool", () =>
            vscode.commands.executeCommand("coarch.prompt.create")
        ),
        vscode.commands.registerCommand("coarch.newfile.gpspec", async () => {
            const newFile = Utils.joinPath(
                vscode.workspace.workspaceFolders[0]?.uri,
                "untitled.gpspec.md"
            ).with({
                scheme: "untitled",
            })
            await vscode.workspace.openTextDocument(newFile)
            const edit = new vscode.WorkspaceEdit()
            edit.insert(newFile, new vscode.Position(0, 0), TEMPLATE)
            vscode.workspace.applyEdit(edit)
        }),
        vscode.commands.registerCommand(
            "coarch.prompt.create",
            async (template?: PromptTemplate) => {
                const name = await vscode.window.showInputBox({
                    title: "Pick a file name for the new GPTool.",
                })
                if (name === undefined) return
                const t = structuredClone(
                    template || {
                        id: "",
                        title: "my tool",
                        text: "New GPtool empty template",
                        jsSource: `script({
title: "${name}",
})

// use $ to output formatted text to the prompt
$\`You are a helpful assistant.\`

// use def to emit LLM variables
def("FILE", env.files)
        `,
                    }
                )
                t.id = ""

                await showPrompt(await copyPrompt(t, { fork: false, name }))
            }
        ),
        vscode.commands.registerCommand(
            "coarch.prompt.fork",
            async (template: PromptTemplate) => {
                if (!template) {
                    if (!state.project) await state.parseWorkspace()
                    const templates = state.project?.templates
                    if (!templates?.length) return
                    const picked = await vscode.window.showQuickPick(
                        templatesToQuickPickItems(templates),
                        {
                            title: `Pick a GPTool to fork`,
                        }
                    )
                    if (picked === undefined) return
                    template = picked.template
                }
                const name = await vscode.window.showInputBox({
                    title: "Pick a file name for the new .genai.js file.",
                    value: template.id,
                })
                if (name === undefined) return
                await showPrompt(
                    await copyPrompt(template, { fork: true, name })
                )
            }
        ),
        vscode.commands.registerCommand(
            "coarch.prompt.unbuiltin",
            async (template: PromptTemplate) => {
                if (!template) return
                await showPrompt(await copyPrompt(template, { fork: false }))
            }
        ),
        vscode.commands.registerCommand(
            "coarch.prompt.navigate",
            async (prompt: PromptTemplate) => {
                const uri = prompt.filename
                    ? vscode.Uri.file(prompt.filename)
                    : builtinPromptUri(prompt.id)
                await vscode.window.showTextDocument(uri)
            }
        )
    )
}

export function commandButtons(state: ExtensionState) {
    const request = state.aiRequest
    const { computing, response } = request || {}
    const { text } = response || {}
    const abort = "Abort"
    const retry = "Retry"
    const output = "Output"
    const trace = "Trace"
    const cmds: { label: string; description?: string; cmd: string }[] = []
    if (computing) cmds.push({ label: abort, cmd: "coarch.request.abort" })
    else if (request)
        cmds.push({
            label: retry,
            description: "Run last gptool and gpspec again.",
            cmd: "coarch.request.retry",
        })
    if (text)
        cmds.push({
            label: output,
            description: "Preview AI response.",
            cmd: "coarch.request.open.output",
        })
    if (request)
        cmds.push({
            label: trace,
            description: "Inspect gptool execution and LLM response.",
            cmd: "coarch.request.open.trace",
        })

    return cmds
}

export function commandButtonsMarkdown(state: ExtensionState, sep = " | ") {
    const res = commandButtons(state)
        .map(({ label, description, cmd }) => `[${label}](command:${cmd})`)
        .join(sep)
    return res
}
