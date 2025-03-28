import * as vscode from "vscode"
import { ExtensionState } from "./state"
import {
    RECONNECT,
    OPEN,
    TOOL_NAME,
    ICON_LOGO_NAME,
    TOOL_ID,
    VSCODE_SERVER_MAX_RETRIES,
    CHANGE,
    SERVER_LOCALHOST,
} from "../../core/src/constants"
import { ServerManager, host } from "../../core/src/host"
import { assert, logError, logInfo, logVerbose } from "../../core/src/util"
import { VsCodeClient } from "../../core/src/server/client"
import { CORE_VERSION } from "../../core/src/version"
import { createChatModelRunner, isLanguageModelsAvailable } from "./lmaccess"
import { semverParse, semverSatisfies } from "../../core/src/semver"
import { resolveCli } from "./config"
import { deleteUndefinedValues } from "../../core/src/cleaners"
import { findRandomOpenPort } from "../../core/src/net"

export class TerminalServerManager
    extends EventTarget
    implements ServerManager
{
    private _terminal: vscode.Terminal
    private _terminalStartAttempts = 0
    private _port: number
    private _startClientPromise: Promise<VsCodeClient>
    private _client: VsCodeClient

    private _status: "stopped" | "stopping" | "starting" | "running" = "stopped"
    get status() {
        return this._status
    }
    private set status(value: "stopped" | "stopping" | "starting" | "running") {
        if (this._status !== value) {
            this._status = value
            this.dispatchChange()
        }
    }

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
        if (!this._port) return undefined
        return `${SERVER_LOCALHOST}:${this._port}`
    }

    get url() {
        return this.state.sessionApiKey
            ? `${this.authority}?api-key=${encodeURIComponent(this.state.sessionApiKey)}`
            : this.authority
    }

    get browserUrl() {
        return this.state.sessionApiKey
            ? `${this.authority}#api-key=${encodeURIComponent(this.state.sessionApiKey)}`
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
        this.status = "running"
        return this._client
    }

    async start() {
        if (this._terminal) return

        this.status = "starting"
        const config = this.state.getConfiguration()
        const diagnostics = this.state.diagnostics
        const debug = diagnostics ? "*" : this.state.debug
        const hideFromUser = !diagnostics && !!config.get("hideServerTerminal")
        const cwd = host.projectFolder()
        await this.allocatePort()
        logVerbose(
            `starting server on port ${this._port} at ${cwd} (DEBUG=${debug || ""})`
        )
        if (this._client) this._client.reconnectAttempts = 0
        this._terminalStartAttempts++
        this._terminal = vscode.window.createTerminal({
            name: TOOL_NAME,
            cwd,
            isTransient: true,
            iconPath: new vscode.ThemeIcon(ICON_LOGO_NAME),
            env: deleteUndefinedValues({
                GENAISCRIPT_API_KEY: this.state.sessionApiKey,
                DEBUG: debug,
                DEBUG_COLORS: "1",
            }),
            hideFromUser,
        })
        const { cliPath, cliVersion } = await resolveCli(this.state)
        const githubCopilotChatClient = isLanguageModelsAvailable()
            ? " --github-copilot-chat-client"
            : ""
        if (cliPath)
            this._terminal.sendText(
                `node "${cliPath}" serve --port ${this._port} --dispatch-progress --cors "*"${githubCopilotChatClient}`
            )
        else
            this._terminal.sendText(
                `npx --yes ${TOOL_ID}@${cliVersion} serve --port ${this._port} --dispatch-progress --cors "*"${githubCopilotChatClient}`
            )
        if (!hideFromUser) this._terminal.show(true)
    }

    async close() {
        try {
            this.status = "stopping"
            this._startClientPromise = undefined
            this._client?.kill()
            this.closeTerminal()
        } finally {
            this.status = "stopped"
        }
    }

    async show(preserveFocus?: boolean) {
        if (!this._terminal) await this.start()
        this._terminal?.show(preserveFocus)
    }

    private closeTerminal() {
        const t = this._terminal
        this._port = undefined
        this._terminal = undefined
        this._client = undefined
        this._startClientPromise = undefined
        if (!this.state.diagnostics) t?.dispose()
    }

    dispose(): any {
        this.close()
    }
}
