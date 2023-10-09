import * as vscode from "vscode"
import { ExtensionState } from "./state"
import { PromptTemplate, copyPrompt } from "coarch-core"
import { builtinPromptUri } from "./markdowndocumentprovider"

const promptViewColumn = vscode.ViewColumn.Two

export function activatePromptCommands(state: ExtensionState) {
    const { context } = state
    const { subscriptions } = context

    async function showPrompt(fn: string) {
        await state.parseWorkspace()
        await vscode.window.showTextDocument(vscode.Uri.file(fn), {
            viewColumn: promptViewColumn,
        })
    }

    subscriptions.push(
        vscode.commands.registerCommand("coarch.prompt.create", async () => {
            const name = await vscode.window.showInputBox({
                title: "Pick a name for the new prompt file.",
            })
            if (name === undefined) return
            await showPrompt(
                await copyPrompt(
                    {
                        id: "",
                        title: "New prompt template",
                        text: "New prompt template",
                        jsSource: `prompt({
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
                if (!template) return
                const name = await vscode.window.showInputBox({
                    title: "Pick a name for the new prompt file.",
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
                const editor = await vscode.window.showTextDocument(uri, {
                    viewColumn: promptViewColumn,
                })
            }
        )
    )
}
