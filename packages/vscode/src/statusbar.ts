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
        const { aiRequest, languageChatModels, host } = state
        const { server } = host
        const { status } = server
        const { computing, progress, options } = aiRequest || {}
        const { fragment } = options || {}
        const { tokensSoFar } = progress || {}
        const loading =
            status === "starting" ||
            status === "stopping" ||
            (computing && !tokensSoFar)
        statusBarItem.text = toStringList(
            `${
                loading ? `$(loading~spin)` : `$(${ICON_LOGO_NAME})`
            }${tokensSoFar ? ` ${tokensSoFar} tokens` : ""}`
        )

        const authority = server.authority
        const md = new vscode.MarkdownString(
            toMarkdownString(
                authority && status === "running"
                    ? `server: [${server.authority}](${server.browserUrl})`
                    : `GenAIScript: ${status}...`,
                status === "starting"
                    ? `On the first run, it may take a while to start the server while npx install 'genaiscript'.`
                    : "",
                fragment?.files?.[0],
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
