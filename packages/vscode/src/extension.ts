import * as vscode from "vscode"
import { ExtensionContext } from "vscode"
import { ExtensionState } from "./state"
import { activateFragmentTreeDataProvider } from "./fragmenttree"
import { activateStatusBar } from "./statusbar"
import "isomorphic-fetch"
import { PromptTemplate, assignIds, concatArrays } from "coarch-core"
import { applyEdits } from "./edit"
import { activateCodeActions } from "./codeactions"
import { activateFragmentCommands } from "./fragmentcommands"
import { activateDecorators } from "./decorators"
import { activateMarkdownTextDocumentContentProvider } from "./markdowndocumentprovider"
import { activatePrompTreeDataProvider } from "./prompttree"
import { activatePromptCommands } from "./promptcommands"
import { clearToken } from "coarch-core"

export async function activate(context: ExtensionContext) {
    const state = new ExtensionState(context)
    activateFragmentTreeDataProvider(state)
    activatePrompTreeDataProvider(state)
    activateStatusBar(state)
    activateCodeActions(state)
    activateFragmentCommands(state)
    activateDecorators(state)
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
            async () => await clearToken()
        ),
        vscode.commands.registerCommand("coarch.assignIds", async () => {
            if (state.project) {
                const edits = concatArrays(
                    ...state.project.allFiles.map((f) => assignIds(f))
                )
                await applyEdits(edits)
            }
        })
    )

    await state.activate()
}
