import * as vscode from "vscode"
import { ExtensionState } from "./state"
import {
    SERVER_PORT,
    RECONNECT,
    TOOL_NAME,
    ICON_LOGO_NAME,
    CLIENT_RECONNECT_MAX_ATTEMPTS,
} from "../../core/src/constants"
import {
    ServerManager,
    host,
    RetrievalService,
    ParseService,
    ModelService,
} from "../../core/src/host"
import { logError } from "../../core/src/util"
import { WebSocketClient } from "../../core/src/server/client"

export class TerminalServerManager implements ServerManager {
    private _terminal: vscode.Terminal
    readonly client: WebSocketClient

    constructor(readonly state: ExtensionState) {
        state.context.subscriptions.push(this)
        state.context.subscriptions.push(
            vscode.window.onDidCloseTerminal((e) => {
                if (e === this._terminal) {
                    try {
                        this.client?.kill()
                    } catch (error) {
                        logError(error)
                    }
                    this._terminal = undefined
                }
            })
        )
        this.client = new WebSocketClient(`http://localhost:${SERVER_PORT}`)
        this.client.addEventListener(RECONNECT, () => {
            // server process died somehow
            if (this.client.reconnectAttempts > CLIENT_RECONNECT_MAX_ATTEMPTS) {
                this.closeTerminal()
                this.start()
            }
        })
    }

    async start() {
        if (this._terminal) return

        this.client.reconnectAttempts = 0
        this._terminal = vscode.window.createTerminal({
            name: TOOL_NAME,
            cwd: host.projectFolder(),
            isTransient: true,
            iconPath: new vscode.ThemeIcon(ICON_LOGO_NAME),
        })
        this._terminal.sendText(`node "${this.state.cliJsPath}" serve`)
        this._terminal.show()
    }

    get started() {
        return !!this._terminal
    }

    get retrieval(): RetrievalService {
        return this.client
    }

    get parser(): ParseService {
        return this.client
    }

    get models(): ModelService {
        return this.client
    }

    async close() {
        this.client?.kill()
        this.closeTerminal()
    }

    private closeTerminal() {
        const t = this._terminal
        this._terminal = undefined
        t?.dispose()
    }

    dispose(): any {
        this.close()
    }
}
