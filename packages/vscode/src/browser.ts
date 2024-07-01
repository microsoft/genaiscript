import * as vscode from "vscode"

export async function openUrlInTab(url: string) {
    await vscode.commands.executeCommand(
        "simpleBrowser.show",
        vscode.Uri.parse(url, true)
    )
}
