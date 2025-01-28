import * as vscode from "vscode"
import { ExtensionState } from "./state"
import {
    SERVER_PORT,
    RECONNECT,
    OPEN,
    TOOL_NAME,
    ICON_LOGO_NAME,
    TOOL_ID,
    VSCODE_SERVER_MAX_RETRIES,
    CHANGE,
} from "../../core/src/constants"
import { ServerManager, host } from "../../core/src/host"
import { assert, logError, logInfo, logVerbose } from "../../core/src/util"
import { VsCodeClient } from "../../core/src/server/client"
import { CORE_VERSION } from "../../core/src/version"
import { createChatModelRunner } from "./lmaccess"
import { semverParse, semverSatisfies } from "../../core/src/semver"
import { resolveCli } from "./config"
import { deleteUndefinedValues } from "../../core/src/cleaners"

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

export class TerminalServerManager
    extends EventTarget
    implements ServerManager
{
    private _terminal: vscode.Terminal
    private _terminalStartAttempts = 0
    private _port: number
    private _startClientPromise: Promise<VsCodeClient>
    private _client: VsCodeClient

    constructor(readonly state: ExtensionState) {
        super()
        const { context } = state
        const { subscriptions } = context
        subscriptions.push(this)
        subscriptions.push(
            vscode.window.onDidCloseTerminal(async (e) => {
                if (e === this._terminal) {
                    try {
                        this._client?.kill()
                    } catch (error) {
                        logError(error)
                    }
                    this._terminal = undefined

                    if (
                        this._terminalStartAttempts > VSCODE_SERVER_MAX_RETRIES
                    ) {
                        logInfo(
                            "server start attempts exceeded, trying out new port"
                        )
                        // kill client to get new port
                        await this._startClientPromise
                        this._client?.kill()
                        this._client = undefined
                    }
                }
            })
        )
        subscriptions.push(
            vscode.workspace.onDidChangeConfiguration((e) => {
                if (e.affectsConfiguration(TOOL_ID + ".cli")) this.close()
            })
        )
    }

    private dispatchChange() {
        this.dispatchEvent(new Event(CHANGE))
    }

    async client(options?: { doNotStart?: boolean }): Promise<VsCodeClient> {
        if (this._client) return this._client
        if (options?.doNotStart) return undefined
        return (
            this._startClientPromise ||
            (this._startClientPromise = this.startClient())
        )
    }

    get authority() {
        assert(!!this._port)
        return `http://127.0.0.1:${this._port}`
    }

    get url() {
        return this.state.sessionApiKey
            ? `${this.authority}?api-key=${encodeURIComponent(this.state.sessionApiKey)}`
            : this.authority
    }

    private async allocatePort() {
        if (isNaN(this._port)) this._port = await findRandomOpenPort()
        return this._port
    }

    private async startClient(): Promise<VsCodeClient> {
        assert(!this._client)
        await this.allocatePort()
        const url = this.url
        const authority = (
            await vscode.env.asExternalUri(vscode.Uri.parse(this.authority))
        ).toString()
        const externalUrl =
            authority +
            (this.state.sessionApiKey
                ? `#api-key=${encodeURIComponent(this.state.sessionApiKey)}`
                : "")
        logInfo(`client url: ${url}`)
        logVerbose(`client external url: ${externalUrl}`)
        const client = (this._client = new VsCodeClient(
            url,
            externalUrl,
            authority
        ))
        client.chatRequest = createChatModelRunner(this.state)
        client.addEventListener(OPEN, async () => {
            if (client !== this._client) return
            this._terminalStartAttempts = 0
            // check version
            const v = await this._client.version()
            const gv = semverParse(CORE_VERSION)
            if (!semverSatisfies(v.version, ">=" + gv.major + "." + gv.minor))
                vscode.window.showWarningMessage(
                    TOOL_ID +
                        ` - genaiscript cli version (${v.version}) outdated, please update to ${CORE_VERSION}`
                )
        })
        client.addEventListener(RECONNECT, () => {
            // server process died somehow
            if (client !== this._client) return
            if (client.connectedOnce) {
                const canReconnect =
                    client.pending &&
                    this._terminalStartAttempts < VSCODE_SERVER_MAX_RETRIES
                this.closeTerminal()
                if (canReconnect) {
                    logInfo("restarting server...")
                    this.start()
                }
            }
        })
        await this.start()
        this._startClientPromise = undefined
        this.dispatchChange()
        return this._client
    }

    async start() {
        if (this._terminal) return

        const config = this.state.getConfiguration()
        const diagnostics = this.state.diagnostics
        const hideFromUser = diagnostics || !!config.get("hideServerTerminal")
        const cwd = host.projectFolder()
        await this.allocatePort()
        logVerbose(`starting server on port ${this._port} at ${cwd}`)
        if (this._client) this._client.reconnectAttempts = 0
        this._terminalStartAttempts++
        this._terminal = vscode.window.createTerminal({
            name: TOOL_NAME,
            cwd,
            isTransient: true,
            iconPath: new vscode.ThemeIcon(ICON_LOGO_NAME),
            env: deleteUndefinedValues({
                GENAISCRIPT_API_KEY: this.state.sessionApiKey,
            }),
            hideFromUser,
        })
        const { cliPath, cliVersion } = await resolveCli(this.state)
        if (cliPath)
            this._terminal.sendText(
                `node "${cliPath}" serve --port ${this._port} --dispatch-progress --cors "*"`
            )
        else
            this._terminal.sendText(
                `npx --yes ${TOOL_ID}@${cliVersion} serve --port ${this._port} --dispatch-progress --cors "*"`
            )
        if (!hideFromUser) this._terminal.show()
        this.dispatchChange()
    }

    get started() {
        return !!this._terminal
    }

    async close() {
        this._startClientPromise = undefined
        this._client?.kill()
        this.closeTerminal()
    }

    private closeTerminal() {
        const t = this._terminal
        this._port = undefined
        this._terminal = undefined
        this._client = undefined
        this._startClientPromise = undefined
        if (!this.state.diagnostics) t?.dispose()
        this.dispatchChange()
    }

    dispose(): any {
        this.close()
    }
}
