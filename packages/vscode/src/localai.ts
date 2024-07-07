import * as vscode from "vscode"
import { openUrlInTab } from "./browser"
import { ICON_LOGO_NAME } from "../../core/src/constants"

export async function startLocalAI() {
    const name = "LocalAI"
    const port = 8080
    if (!vscode.window.terminals.find((t) => t.name === name)) {
        // show results
        const terminal = vscode.window.createTerminal({
            name,
            isTransient: true,
            iconPath: new vscode.ThemeIcon(ICON_LOGO_NAME),
            strictEnv: true,
            env: {},
        })
        terminal.sendText(`docker run -p 8080:8080 --name local-ai -ti localai/localai:latest-aio-cpu
docker start local-ai
docker stats
`)
        await openUrlInTab(`http://127.0.0.1:${port}`)
    }
}
