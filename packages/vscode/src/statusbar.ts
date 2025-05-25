import * as vscode from "vscode"
import { ExtensionState } from "./state"
import { toMarkdownString } from "./markdown"
import { ICON_LOGO_NAME, CHANGE } from "../../core/src/constants"
import { toStringList } from "../../core/src/util"
import { CORE_VERSION } from "../../core/src/version"

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
                    ? `server${server.version ? ` v${server.version}` : ""}: [${server.authority}](${server.browserUrl})`
                    : `GenAIScript: ${status}...`,
                status === "starting"
                    ? `Please be patient, the server might need to install dependencies.\n[Show Server Terminal](command:genaiscript.server.show)`
                    : "",
                fragment?.files?.[0],
                ...Object.entries(languageChatModels).map(
                    ([m, c]) => `-  language chat model: ${m} -> ${c}`
                )
            ),
            true
        )
        md.isTrusted = {
            enabledCommands: ["genaiscript.server.show"],
        }
        statusBarItem.tooltip = md
    }

    state.addEventListener(CHANGE, updateStatusBar)
    state.host.server.addEventListener(CHANGE, updateStatusBar)

    updateStatusBar()
    context.subscriptions.push(statusBarItem)
    statusBarItem.show()
}
