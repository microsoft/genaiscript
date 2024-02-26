import * as vscode from "vscode"
import { ExtensionState } from "./state"
import {
    TOKENS_STATUS_BAR_DEBOUNCE_TIME,
    estimateTokens,
} from "genaiscript-core"
import { debounceAsync } from "./debounce"

export function activateTokensStatusBar(state: ExtensionState) {
    const { context } = state

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
        const docTokens = estimateTokens(model, document.getText())
        statusBarItem.text = `toks: ${docTokens}`
    }, TOKENS_STATUS_BAR_DEBOUNCE_TIME)
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
