import * as vscode from "vscode"
import { ExtensionState } from "./state"
import { estimateTokens } from "genaiscript-core"
import { debounceAsync } from "./debounce"

export function activateTokensStatusBar(state: ExtensionState) {
    const { context, host } = state

    const statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        120
    )
    const updateStatusBar = debounceAsync(async () => {
        const model = "gpt-4"
        const editor = vscode.window.activeTextEditor
        if (!editor) {
            statusBarItem.text = ""
            return
        }
        const document = editor.document
        const selections = editor.selections.filter((s) => !s.isEmpty)
        const docTokens = estimateTokens(model, document.getText())
        statusBarItem.text = `Tks: ${docTokens}`
    }, 500)
    updateStatusBar()
    context.subscriptions.push(
        statusBarItem,
        vscode.window.onDidChangeActiveTextEditor(updateStatusBar),
        vscode.workspace.onDidChangeTextDocument((e) => {
            if (e.document === vscode.window.activeTextEditor?.document)
                updateStatusBar()
        })
    )
    statusBarItem.show()
}
