import {
    CLI_JS,
    GENAISCRIPT_FOLDER,
    HighlightService,
    ICON_LOGO_NAME,
    RetreivalService,
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
                        logError(error.message)
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
        this._terminal.sendText(
            `node ${host.path.join(GENAISCRIPT_FOLDER, CLI_JS)} serve`
        )
        this._terminal.show()
    }

    get retreival(): RetreivalService {
        return this.client
    }

    get highlight(): HighlightService {
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
