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
    MIN_NODE_VERSION_MAJOR,
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
import { packageResolveExecute } from "../../core/src/packagemanagers"
import { shellQuote } from "../../core/src/shell"
import { log } from "node:console"

export class TerminalServerManager
    extends EventTarget
    implements ServerManager
{
    private _terminal: vscode.Terminal
    private _terminalStartAttempts = 0
    private _port: number
    private _startClientPromise: Promise<VsCodeClient>
    private _client: VsCodeClient
    private _version: string

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

    get version() {
        return this._version
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
            this._version = v.version
            const gv = semverParse(CORE_VERSION)
            if (!semverSatisfies(v.version, ">=" + gv.major + "." + gv.minor))
                vscode.window.showWarningMessage(
                    TOOL_ID +
                        ` - genaiscript cli version (${v.version}) outdated, please update to ${CORE_VERSION}`
                )
            this.status = "running"
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
        const { cliPath, cliVersion, packageManager } = await resolveCli(
            this.state
        )
        const githubCopilotChatClient = isLanguageModelsAvailable()
            ? "--github-copilot-chat-client"
            : ""

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
        if (cliPath)
            this._terminal.sendText(
                `node "${cliPath}" serve --port ${this._port} --dispatch-progress --cors "*" ${githubCopilotChatClient}`
            )
        else {
            const pkg = await packageResolveExecute(
                cwd,
                [
                    `${TOOL_ID}@${cliVersion}`,
                    `serve`,
                    `--port`,
                    `${this._port}`,
                    `--dispatch-progress`,
                    `--cors`,
                    `"*"`,
                    githubCopilotChatClient,
                ],
                { agent: packageManager }
            )
            const cmd = [shellQuote([pkg.command]), ...pkg.args].join(" ")
            logVerbose(cmd)
            this._terminal.sendText(cmd, true)
        }
        if (!hideFromUser) this._terminal.show(true)

        // check node asynchronously
        this.checkNode()
    }

    private nodeVersionValidated = false
    async checkNode() {
        if (this.nodeVersionValidated) return
        this.nodeVersionValidated = true
        return new Promise<void>((resolve) => {
            logVerbose("checking node version")
            const cwd = host.projectFolder()
            const terminal = vscode.window.createTerminal({
                cwd,
                isTransient: true,
                hideFromUser: true,
            })
            // TODO: never triggers on windows+powershell
            const cleanup = vscode.window.onDidChangeTerminalShellIntegration(
                async (e) => {
                    if (e.terminal === this._terminal) {
                        logVerbose(`node terminal started`)
                        cleanup.dispose()
                        await checkNodeCommand(terminal)
                        resolve()
                    }
                },
                this.state.context.subscriptions
            )
        })

        async function checkNodeCommand(
            terminal: vscode.Terminal
        ): Promise<boolean> {
            assert(!!terminal, "terminal not started")
            // Log all data written to the terminal for a command
            const command = terminal.shellIntegration.executeCommand("node -v")
            let output = ""
            for await (const chunk of command.read()) output += chunk

            logVerbose(`node version: ${output}`)
            if (!output) {
                vscode.window.showErrorMessage(
                    "Node.js is not installed or not in PATH. Please install Node.js to use the server."
                )
                return false
            }
            const major = parseInt(
                /v(?<major>\d+)\.\d+\.\d+/.exec(output)?.groups.major
            )
            if (!(major >= MIN_NODE_VERSION_MAJOR)) {
                vscode.window.showErrorMessage(
                    `Node.js version ${output} is not supported or not recognized. Please update to version ${MIN_NODE_VERSION_MAJOR} or higher.`
                )
                return false
            }
            return true
        }
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
