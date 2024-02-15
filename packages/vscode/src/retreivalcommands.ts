import * as vscode from "vscode"
import { ExtensionState } from "./state"
import {
    checkDirectoryExists,
    checkFileExists,
    saveAllTextDocuments,
} from "./fs"
import {
    GENAISCRIPT_FOLDER,
    TOOL_NAME,
    clearIndex,
    initToken,
    isIndexable,
    upsert,
} from "genaiscript-core"

export function activateRetreivalCommands(state: ExtensionState) {
    const { context, host } = state
    const { subscriptions } = context

    const index = async (uri: vscode.Uri) => {
        let files: string[] = []
        if (!uri) {
            files = (await vscode.workspace.findFiles("**/*"))
                .map((f) => vscode.workspace.asRelativePath(f))
                .filter((f) => !f.startsWith("."))
        } else if (await checkDirectoryExists(uri)) {
            const dir = await vscode.workspace.fs.readDirectory(uri)
            files = dir
                .filter(([name, type]) => type === vscode.FileType.File)
                .map(([name]) =>
                    vscode.workspace.asRelativePath(
                        vscode.Uri.joinPath(uri, name)
                    )
                )
        } else if (await checkFileExists(uri)) {
            files = [vscode.workspace.asRelativePath(uri)]
        }

        files = files
            .filter((f) => !f.includes(GENAISCRIPT_FOLDER))
            .filter((f) => !f.startsWith(".") && !f.startsWith("node_modules"))
            .filter((f) => isIndexable(f))

        if (!files?.length) {
            vscode.window.showInformationMessage(
                `${TOOL_NAME} - No files to index`
            )
            return
        }

        await initToken()
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: `${TOOL_NAME} - Indexing`,
                cancellable: false,
            },
            async (progress) => {
                try {
                    await upsert(files, { progress })
                } catch (e) {
                    vscode.window.showErrorMessage(e.message)
                }
            }
        )
    }

    subscriptions.push(
        vscode.commands.registerCommand("genaiscript.retreival.index", index),
        vscode.commands.registerCommand(
            "genaiscript.retreival.clear",
            clearIndex
        )
    )
}
