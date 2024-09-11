import * as vscode from "vscode"
import { ExtensionState } from "./state"
import {
    SERVER_PORT,
    RECONNECT,
    OPEN,
    TOOL_NAME,
    ICON_LOGO_NAME,
    CLIENT_RECONNECT_MAX_ATTEMPTS,
    TOOL_ID,
    VSCODE_CONFIG_CLI_VERSION,
    VSCODE_CONFIG_CLI_PATH,
} from "../../core/src/constants"
import { ServerManager, host } from "../../core/src/host"
import { logError, logVerbose } from "../../core/src/util"
import { WebSocketClient } from "../../core/src/server/client"
import { CORE_VERSION } from "../../core/src/version"
import { createChatModelRunner } from "./lmaccess"
import { semverParse, semverSatisfies } from "../../core/src/semver"

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
                if (e.affectsConfiguration(TOOL_ID + ".cli")) this.close()
            })
        )

        this.client = new WebSocketClient(`http://localhost:${SERVER_PORT}`)
        this.client.chatRequest = createChatModelRunner(this.state)
        this.client.addEventListener(OPEN, async () => {
            // client connected to a rogue server
            if (!this._terminal) {
                logVerbose("found rogue server, closing...")
                this.client?.kill()
            } else {
                // check version
                const v = await this.client.version()
                const gv = semverParse(CORE_VERSION)
                if (
                    !semverSatisfies(
                        v.version,
                        ">=" + gv.major + "." + gv.minor
                    )
                )
                    vscode.window.showWarningMessage(
                        TOOL_ID +
                            ` - genaiscript cli version (${v.version}) outdated, please update to ${CORE_VERSION}`
                    )
            }
        })
        this.client.addEventListener(RECONNECT, () => {
            // server process died somehow
            if (this.client.connectedOnce) {
                this.closeTerminal()
                if (this.client.pending) this.start()
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
        const cliPath = config.get(VSCODE_CONFIG_CLI_PATH) as string
        if (cliPath) this._terminal.sendText(`node "${cliPath}" serve`)
        else {
            const cliVersion =
                (config.get(VSCODE_CONFIG_CLI_VERSION) as string) ||
                CORE_VERSION
            this._terminal.sendText(`npx --yes ${TOOL_ID}@${cliVersion} serve`)
        }
        this._terminal.show()
    }

    get started() {
        return !!this._terminal
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
