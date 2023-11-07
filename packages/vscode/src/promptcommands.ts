import * as vscode from "vscode"
import { Utils } from "vscode-uri"
import { ExtensionState } from "./state"
import { PromptTemplate, copyPrompt } from "coarch-core"
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
        vscode.commands.registerCommand("coarch.prompt.create", async () => {
            const name = await vscode.window.showInputBox({
                title: "Pick a file name for the new GPTool.",
            })
            if (name === undefined) return
            await showPrompt(
                await copyPrompt(
                    {
                        id: "",
                        title: "my tool",
                        text: "New GPtool empty template",
                        jsSource: `gptool({
    title: "${name}",
})

// use $ to output formatted text to the prompt
$\`You are a helpful assistant.\`

// use def to emit and reference chunks of text
def("FILE", env.file)
                `,
                    },
                    { fork: false, name }
                )
            )
        }),
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
                    title: "Pick a file name for the new .gptool.js file.",
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
