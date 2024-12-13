import * as vscode from "vscode"
import { ExtensionState } from "./state"
import {
    SERVER_PORT,
    RECONNECT,
    OPEN,
    TOOL_NAME,
    ICON_LOGO_NAME,
    TOOL_ID,
} from "../../core/src/constants"
import { ServerManager, host } from "../../core/src/host"
import { assert, logError, logInfo, logVerbose } from "../../core/src/util"
import { WebSocketClient } from "../../core/src/server/client"
import { CORE_VERSION } from "../../core/src/version"
import { createChatModelRunner } from "./lmaccess"
import { semverParse, semverSatisfies } from "../../core/src/semver"
import { resolveCli } from "./config"

function findRandomOpenPort() {
    return new Promise<number>((resolve, reject) => {
        const server = require("net").createServer()
        server.unref()
        server.on("error", reject)
        server.listen(0, () => {
            const port = server.address().port
            server.close(() => resolve(port))
        })
    })
}

export class TerminalServerManager implements ServerManager {
    private _terminal: vscode.Terminal
    private _port: number
    private _startClientPromise: Promise<WebSocketClient>
    private _client: WebSocketClient

    constructor(readonly state: ExtensionState) {
        const { context } = state
        const { subscriptions } = context
        subscriptions.push(this)
        subscriptions.push(
            vscode.window.onDidCloseTerminal((e) => {
                if (e === this._terminal) {
                    try {
                        this._client?.kill()
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
    }

    async client(options?: { doNotStart?: boolean }): Promise<WebSocketClient> {
        if (this._client) return this._client
        if (options?.doNotStart) return undefined
        return (
            this._startClientPromise ||
            (this._startClientPromise = this.startClient())
        )
    }

    private async startClient(): Promise<WebSocketClient> {
        assert(!this._client)
        this._port = await findRandomOpenPort()
        const url = `http://localhost:${this._port}?api-key=${encodeURIComponent(this.state.sessionApiKey)}`
        logInfo(`client url: ${url}`)
        this._client = new WebSocketClient(url)
        this._client.chatRequest = createChatModelRunner(this.state)
        this._client.addEventListener(OPEN, async () => {
            // client connected to a rogue server
            if (!this._terminal) {
                logVerbose("found rogue server, closing...")
                this._client?.kill()
            } else {
                // check version
                const v = await this._client.version()
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
        this._client.addEventListener(RECONNECT, () => {
            // server process died somehow
            if (this._client.connectedOnce) {
                this.closeTerminal()
                if (this._client.pending) this.start()
            }
        })
        this._startClientPromise = undefined
        return this._client
    }

    async start() {
        if (this._terminal) return

        const cwd = host.projectFolder()
        this.state.output.appendLine(
            `starting server on port ${this._port} at ${cwd}`
        )
        this._client.reconnectAttempts = 0
        this._terminal = vscode.window.createTerminal({
            name: TOOL_NAME,
            cwd,
            isTransient: true,
            iconPath: new vscode.ThemeIcon(ICON_LOGO_NAME),
            env: {
                GENAISCRIPT_API_KEY: this.state.sessionApiKey,
            },
        })
        const { cliPath, cliVersion } = await resolveCli()
        if (cliPath)
            this._terminal.sendText(
                `node "${cliPath}" serve --port ${this._port}`
            )
        else
            this._terminal.sendText(
                `npx --yes ${TOOL_ID}@${cliVersion} serve --port ${this._port}`
            )
        this._terminal.show()
    }

    get started() {
        return !!this._terminal
    }

    async close() {
        this._client?.kill()
        this.closeTerminal()
    }

    private closeTerminal() {
        const t = this._terminal
        this._terminal = undefined
        if (!this.state.diagnostics) t?.dispose()
    }

    dispose(): any {
        this.close()
    }
}
