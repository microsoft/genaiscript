import * as vscode from "vscode"
import { ExtensionContext } from "vscode"
import { ExtensionState } from "./state"
import { activateFragmentTreeDataProvider } from "./fragmenttree"
import { activateStatusBar } from "./statusbar"
import "isomorphic-fetch"
import { initToken, isCancelError } from "coarch-core"
import { activateCodeActions } from "./codeactions"
import { activateFragmentCommands } from "./fragmentcommands"
import { activateDecorators } from "./decorators"
import { activateMarkdownTextDocumentContentProvider } from "./markdowndocumentprovider"
import { activatePrompTreeDataProvider } from "./prompttree"
import { activatePromptCommands } from "./promptcommands"
import { clearToken } from "coarch-core"
import { activateRunnerView } from "./runnerview"
import { activateRequestTreeDataProvider } from "./requesttree"

export async function activate(context: ExtensionContext) {
    const state = new ExtensionState(context)
    activatePrompTreeDataProvider(state)
    activateFragmentTreeDataProvider(state)
    activateRunnerView(state)
    activateRequestTreeDataProvider(state)
    activateStatusBar(state)
    activateCodeActions(state)
    activateFragmentCommands(state)
    //activateDecorators(state)
    //activateCodeLens(state);
    activateMarkdownTextDocumentContentProvider(state)
    activatePromptCommands(state)

    context.subscriptions.push(
        vscode.commands.registerCommand("coarch.openai.cancel", async () => {
            state.cancelAiRequest()
            await vscode.window.showInformationMessage(
                "CoArch - OpenAI request cancelled."
            )
        }),
        vscode.commands.registerCommand(
            "coarch.openai.token.clear",
            async () => {
                await clearToken()
                await vscode.window.showInformationMessage(
                    "CoArch - OpenAI token cleared."
                )
            }
        ),
        vscode.commands.registerCommand(
            "coarch.openai.token.update",
            async () => {
                try {
                    await clearToken()
                    await initToken(true)
                } catch (e) {
                    if (isCancelError(e)) return
                    throw e
                }
            }
        ),
        vscode.commands.registerCommand("coarch.request.status", async () => {
            const r = state.aiRequest
            const { computing, options } = r || {}
            if (!computing) {
                vscode.commands.executeCommand("coarch.request.open")
            } else {
                const { template } = options || {}
                const cancel = "Cancel"
                const trace = "Open Trace"
                const res = await vscode.window.showInformationMessage(
                    `CoArch - running ${template.title}`,
                    trace,
                    cancel
                )
                if (res === cancel)
                    vscode.commands.executeCommand("coarch.request.cancel")
                else if (res === trace)
                    vscode.commands.executeCommand("coarch.request.open")
            }
        })
    )

    await state.activate()
}
