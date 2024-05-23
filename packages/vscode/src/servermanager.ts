import {
    ICON_LOGO_NAME,
    ModelService,
    ParseService,
    RetrievalService,
    SERVER_PORT,
    ServerManager,
    TOOL_NAME,
    WebSocketClient,
    host,
    logError,
} from "genaiscript-core"
import * as vscode from "vscode"
import { ExtensionState } from "./state"

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
    }

    async start() {
        if (this._terminal) return

        this._terminal = vscode.window.createTerminal({
            name: `${TOOL_NAME} Server`,
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
        this._terminal?.dispose()
        this._terminal = undefined
    }

    dispose(): any {
        this.close()
    }
}
