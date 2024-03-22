import * as vscode from "vscode"
import { ExtensionState } from "./state"
import { toMarkdownString } from "./markdown"
import { CHANGE, ICON_LOGO_NAME } from "genaiscript-core"
import { Utils } from "vscode-uri"

function toStringList(...token: string[]) {
    const md = token.filter((l) => l !== undefined && l !== null).join(", ")
    return md
}

export function activateStatusBar(state: ExtensionState) {
    const { context, host } = state

    const statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        120
    )
    statusBarItem.command = "genaiscript.request.status"
    const updateStatusBar = async () => {
        const { parsing } = state
        const { computing, progress, options, editsApplied } =
            state.aiRequest || {}
        const { template, fragment } = options || {}
        const { tokensSoFar } = progress || {}
        statusBarItem.text =
            `$(${ICON_LOGO_NAME}) ` +
            toStringList(
                parsing || (computing && !tokensSoFar)
                    ? `$(loading~spin)`
                    : undefined,
                tokensSoFar ? `${tokensSoFar} tokens` : undefined
            )

        const md = new vscode.MarkdownString(
            toMarkdownString(
                fragment
                    ? Utils.basename(vscode.Uri.file(fragment.file.filename))
                    : undefined,
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
