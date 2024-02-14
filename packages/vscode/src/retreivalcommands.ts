import * as vscode from "vscode"
import { ExtensionState } from "./state"
import { checkDirectoryExists, checkFileExists } from "./fs"
import {
    GENAISCRIPT_FOLDER,
    TOOL_NAME,
    isIndexable,
    upsert,
} from "genaiscript-core"

export function activateRetreivalCommands(state: ExtensionState) {
    const { context, host } = state
    const { subscriptions } = context

    const getToken = async () => {
        let token = await host.readSecret("RETREIVAL_TOKEN")
        if (!token) {
            const newToken = await vscode.window.showInputBox({
                prompt: "Enter your Retreival API token",
                placeHolder: "Retreiaval API token",
            })
            if (newToken === undefined) return undefined

            // save in .env file
            token = newToken
        }

        return token
    }

    const index = async (uri: vscode.Uri) => {
        if (!(await getToken())) return

        let files: string[] = []
        if (!uri) {
            files = (await vscode.workspace.findFiles("**/*"))
                .map((f) => vscode.workspace.asRelativePath(f))
                .filter((f) => !f.startsWith("."))
        } else if (await checkDirectoryExists(uri)) {
            const dir = await vscode.workspace.fs.readDirectory(uri)
            files = dir
                .filter(
                    ([name, type]) =>
                        type === vscode.FileType.File &&
                        !name.startsWith(".") &&
                        name.startsWith("node_modules")
                )
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
            .filter((f) => isIndexable(f))

        if (!files?.length) {
            vscode.window.showInformationMessage(
                `${TOOL_NAME} - No files to index`
            )
            return
        }

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
        vscode.commands.registerCommand("genaiscript.retreival.index", index)
    )
}
