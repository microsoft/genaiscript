import * as vscode from "vscode"
import { ExtensionState, SEARCH_OUTPUT_FILENAME } from "./state"
import { checkDirectoryExists, checkFileExists, listFiles } from "./fs"
import {
    GENAISCRIPT_FOLDER,
    TOOL_NAME,
    clearIndex,
    isIndexable,
    search as retreivalSearch,
    ICON_LOGO_NAME,
    RETRIEVAL_DEFAULT_INDEX,
} from "genaiscript-core"
import { infoUri } from "./markdowndocumentprovider"
import { showMarkdownPreview } from "./markdown"

export function activateRetreivalCommands(state: ExtensionState) {
    const { context } = state
    const { subscriptions } = context

    const resolveIndexName = async () => {
        const indexName = await vscode.window.showInputBox({
            title: "Enter an index name",
            value: RETRIEVAL_DEFAULT_INDEX,
            validateInput: (value) => {
                if (/[^a-z0-9_]/i.test(value))
                    return "Only letters, numbers and underscores are allowed"
                return null
            },
        })
        return indexName
    }

    const resolveFiles = async (uri: vscode.Uri) => {
        let files: string[] = []
        if (!uri) {
            files = (await vscode.workspace.findFiles("**/*"))
                .map((f) => vscode.workspace.asRelativePath(f))
                .filter((f) => !f.startsWith("."))
        } else if (await checkDirectoryExists(uri)) {
            files = (await listFiles(uri)).map((u) =>
                vscode.workspace.asRelativePath(u)
            )
        } else if (await checkFileExists(uri)) {
            files = [vscode.workspace.asRelativePath(uri)]
        }

        files = files
            .filter((f) => !f.includes(GENAISCRIPT_FOLDER))
            .filter((f) => !f.startsWith(".") && !f.startsWith("node_modules"))
            .filter((f) => isIndexable(f))
        return files
    }

    const search = async (uri: vscode.Uri) => {
        const files = await resolveFiles(uri)
        if (!files?.length) {
            vscode.window.showInformationMessage(
                `${TOOL_NAME} - No files to search`
            )
            return
        }
        let indexName = await resolveIndexName()
        if (indexName === undefined) return
        if (indexName === "") indexName = RETRIEVAL_DEFAULT_INDEX

        const keywords = await vscode.window.showInputBox({
            title: "Enter search query",
        })
        if (!keywords) return

        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: `${TOOL_NAME} - Searching...`,
                cancellable: true,
            },
            async (progress, token) => {
                try {
                    state.lastSearch = undefined
                    const res = await retreivalSearch(keywords, {
                        files,
                        token,
                    })
                    state.lastSearch = res
                    await showMarkdownPreview(infoUri(SEARCH_OUTPUT_FILENAME))
                } catch (e) {
                    vscode.window.showErrorMessage(e.message)
                }
            }
        )
    }

    const index = async (uri: vscode.Uri) => {
        const indexName = await resolveIndexName()
        if (indexName === undefined) return

        const host = state.host
        const terminal = vscode.window.createTerminal({
            name: `${TOOL_NAME} Indexer`,
            cwd: host.projectFolder(),
            isTransient: true,
            iconPath: new vscode.ThemeIcon(ICON_LOGO_NAME),
        })
        terminal.sendText(
            `node "${state.cliJsPath}" retreival index "${host.path.join(vscode.workspace.asRelativePath(uri.fsPath), "**")}" --name ${indexName}`
        )
        terminal.show()
    }

    subscriptions.push(
        vscode.commands.registerCommand("genaiscript.retreival.index", index),
        vscode.commands.registerCommand("genaiscript.retreival.search", search),
        vscode.commands.registerCommand(
            "genaiscript.retreival.clear",
            clearIndex
        )
    )
}
