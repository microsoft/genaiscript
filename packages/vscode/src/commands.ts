import { errorMessage, TOOL_NAME } from "genaiscript-core"
import * as vscode from "vscode"

export function registerCommand(
    id: string,
    command: (...args: any[]) => Thenable<void>
) {
    return vscode.commands.registerCommand(id, async function (...args: any[]) {
        try {
            await command(...args)
        } catch (e) {
            console.debug(e)
            vscode.window.showErrorMessage(TOOL_NAME + " - " + errorMessage(e))
        }
    })
}
