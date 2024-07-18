import * as vscode from "vscode"
import { ExtensionState } from "./state"
import {
    SERVER_PORT,
    RECONNECT,
    TOOL_NAME,
    ICON_LOGO_NAME,
    CLIENT_RECONNECT_MAX_ATTEMPTS,
    TOOL_ID,
    VSCODE_CONFIG_CLI_VERSION,
    VSCODE_CONFIG_CLI_PATH,
} from "../../core/src/constants"
import { ServerManager, host, ParseService } from "../../core/src/host"
import { logError } from "../../core/src/util"
import { WebSocketClient } from "../../core/src/server/client"
import { CORE_VERSION } from "../../core/src/version"

export class TerminalServerManager implements ServerManager {
    private _terminal: vscode.Terminal
    readonly client: WebSocketClient

    constructor(readonly state: ExtensionState) {
        const { context } = state
        const { subscriptions } = context
        subscriptions.push(this)
        subscriptions.push(
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
        subscriptions.push(
            vscode.workspace.onDidChangeConfiguration((e) => {
                if (e.affectsConfiguration(TOOL_ID)) this.close()
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
        const config = vscode.workspace.getConfiguration(TOOL_ID)
        const cliVersion = (config.get(VSCODE_CONFIG_CLI_VERSION) as string) ?? CORE_VERSION
        const cliPath = config.get(VSCODE_CONFIG_CLI_PATH) as string
        if (cliPath) this._terminal.sendText(`node "${cliPath}" serve`)
        else
            this._terminal.sendText(`npx --yes genaiscript@${cliVersion} serve`)
        this._terminal.show()
    }

    get started() {
        return !!this._terminal
    }

    get parser(): ParseService {
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
