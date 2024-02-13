import {
    CLI_JS,
    ServerManager,
    TOOL_NAME,
    dotGenaiscriptPath,
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

        const { context } = this.state
        this._terminal = vscode.window.createTerminal({
            name: `${TOOL_NAME} Server`,
        })
        this._terminal.show()
        this._terminal.sendText(`node ${dotGenaiscriptPath(CLI_JS)} serve`)
    }

    async close() {
        this._terminal?.dispose()
        this._terminal = undefined
    }

    dispose(): any {
        this.close()
    }
}
