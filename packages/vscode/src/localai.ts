import { ICON_LOGO_NAME } from "genaiscript-core"
import * as vscode from "vscode"

export async function startLocalAI() {
    const name = "LocalAI"
    const port = 8080
    if (!vscode.window.terminals.find((t) => t.name === name)) {
        // show results
        const terminal = vscode.window.createTerminal({
            name,
            isTransient: true,
            iconPath: new vscode.ThemeIcon(ICON_LOGO_NAME),
        })
        terminal.sendText(
            `docker run -p 8080:8080 --name local-ai -ti localai/localai:latest-aio-cpu`
        )
        await vscode.commands.executeCommand(
            "simpleBrowser.show",
            vscode.Uri.parse(`http://127.0.0.1:${port}`)
        )
    }
}
