import * as vscode from "vscode"
import { CHANGE, ExtensionState } from "./state"
import { toFencedCodeBlock, toMarkdownString, toStringList } from "./markdown"

export function activateStatusBar(state: ExtensionState) {
    const { context } = state

    const statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        120
    )
    statusBarItem.command = "coarch.request.status"
    const updateStatusBar = () => {
        const { computing, progress, template, fragments } =
            state.aiRequest || {}
        const { tokensSoFar } = progress || {}
        statusBarItem.text = toStringList(
            tokensSoFar > 0
                ? `(${tokensSoFar} tokens)`
                : computing
                    ? `$(loading~spin)`
                    : undefined,
            "CoArch",
            template?.title
        )
        const md = new vscode.MarkdownString(
            toMarkdownString(
                template
                    ? `-  template: ${template.title} (${template.id})`
                    : undefined,
                ...(fragments?.map(
                    (fragment) =>
                        `-  fragment: ${fragment.title} (#${fragment.id || ""})`
                ) || []),
            )
        )
        statusBarItem.tooltip = md
    }

    state.addEventListener(CHANGE, updateStatusBar)

    updateStatusBar()
    context.subscriptions.push(statusBarItem)
    statusBarItem.show()
}
