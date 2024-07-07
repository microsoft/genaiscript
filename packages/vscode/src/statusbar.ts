import * as vscode from "vscode"
import { ExtensionState } from "./state"
import { toMarkdownString } from "./markdown"
import { ICON_LOGO_NAME, CHANGE } from "../../core/src/constants"
import { toStringList } from "../../core/src/util"

export function activateStatusBar(state: ExtensionState) {
    const { context } = state

    const statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        120
    )
    statusBarItem.command = "genaiscript.request.status"
    const updateStatusBar = async () => {
        const { parsing, aiRequest } = state
        const { computing, progress, options } = aiRequest || {}
        const { template, fragment } = options || {}
        const { tokensSoFar } = progress || {}
        statusBarItem.text = toStringList(
            `${
                parsing || (computing && !tokensSoFar)
                    ? `$(loading~spin)`
                    : `$(${ICON_LOGO_NAME})`
            }${tokensSoFar ? ` ${tokensSoFar} tokens` : ""}`
        )

        const md = new vscode.MarkdownString(
            toMarkdownString(
                fragment?.files?.[0],
                template
                    ? `-  tool: ${template.title} (${template.id})`
                    : undefined
            ),
            true
        )
        md.isTrusted = true
        statusBarItem.tooltip = md
    }

    state.addEventListener(CHANGE, updateStatusBar)

    updateStatusBar()
    context.subscriptions.push(statusBarItem)
    statusBarItem.show()
}
