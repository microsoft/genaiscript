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
        const { parsing, aiRequest, languageChatModels, host } = state
        const { server } = host
        const { status } = server
        const { computing, progress, options } = aiRequest || {}
        const { template, fragment } = options || {}
        const { tokensSoFar } = progress || {}
        statusBarItem.text = toStringList(
            `${
                parsing ||
                status === "starting" ||
                status === "stopping" ||
                (computing && !tokensSoFar)
                    ? `$(loading~spin)`
                    : `$(${ICON_LOGO_NAME})`
            }${tokensSoFar ? ` ${tokensSoFar} tokens` : ""}`
        )

        const md = new vscode.MarkdownString(
            toMarkdownString(
                status === "running"
                    ? `server: [${server.authority}](${server.browserUrl})`
                    : `server: ${status}`,
                fragment?.files?.[0],
                template
                    ? `-  tool: ${template.title} (${template.id})`
                    : undefined,
                ...Object.entries(languageChatModels).map(
                    ([m, c]) => `-  language chat model: ${m} -> ${c}`
                )
            ),
            true
        )
        md.isTrusted = true
        statusBarItem.tooltip = md
    }

    state.addEventListener(CHANGE, updateStatusBar)
    state.host.server.addEventListener(CHANGE, updateStatusBar)

    updateStatusBar()
    context.subscriptions.push(statusBarItem)
    statusBarItem.show()
}
