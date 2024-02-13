import { CLI_JS, TOOL_NAME } from "genaiscript-core"
import * as vscode from "vscode"
import { ExtensionState } from "./state"
import { Utils } from "vscode-uri"

export class ServerManager {
    private _terminal: vscode.Terminal

    constructor(readonly state: ExtensionState) {
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

        const { context } = this.state
        this._terminal = vscode.window.createTerminal({
            name: `${TOOL_NAME} Server`,
            cwd: context.extensionPath,
        })
        this._terminal.show()
        this._terminal.sendText(`npm install --no-save llamaindex`)
        this._terminal.sendText(`node ${CLI_JS} serve`)
    }

    async close() {
        this._terminal?.dispose()
        this._terminal = undefined
    }

    dispose(): any {
        this.close()
    }
}
