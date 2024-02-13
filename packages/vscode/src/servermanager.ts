import {
    CLI_JS,
    GENAISCRIPT_FOLDER,
    ServerManager,
    TOOL_NAME,
    host,
} from "genaiscript-core"
import * as vscode from "vscode"
import { ExtensionState } from "./state"

export class TerminalServerManager implements ServerManager {
    private _terminal: vscode.Terminal

    constructor(readonly state: ExtensionState) {
        state.context.subscriptions.push(this)
        state.context.subscriptions.push(
            vscode.window.onDidCloseTerminal((e) => {
                if (e === this._terminal) {
                    this._terminal = undefined
                }
            })
        )
    }

    async start() {
        if (this._terminal) return

        vscode.window.showInformationMessage(
            `${TOOL_NAME} - starting server...`
        )
        this._terminal = vscode.window.createTerminal({
            name: `${TOOL_NAME} Server`,
            cwd: host.projectFolder(),
        })
        this._terminal.sendText(
            `node ${host.path.join(GENAISCRIPT_FOLDER, CLI_JS)} serve`
        )
        await new Promise((resolve) => setTimeout(resolve, 2000))
    }

    async close() {
        this._terminal?.dispose()
        this._terminal = undefined
    }

    dispose(): any {
        this.close()
    }
}
