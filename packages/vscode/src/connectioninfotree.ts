import * as vscode from "vscode"
import { ExtensionState } from "./state"
import { MODEL_PROVIDERS } from "../../core/src/constants"
import { YAMLStringify } from "../../core/src/yaml"
import { OpenAIAPIType } from "../../core/src/host"

class ConnectionInfoTreeData {
    provider: string
    apiType?: OpenAIAPIType
}

class ConnectionInfoTreeDataProvider
    implements vscode.TreeDataProvider<ConnectionInfoTreeData>
{
    constructor(readonly state: ExtensionState) {
        const { context } = state
        const { subscriptions } = context
        subscriptions.push(
            vscode.workspace.onDidChangeConfiguration(() => {
                this.refresh()
            })
        )
        const watcher = vscode.workspace.createFileSystemWatcher("./.env")
        watcher.onDidChange(() => this.refresh())
        watcher.onDidDelete(() => this.refresh())
        subscriptions.push(watcher)
    }

    async getTreeItem(
        element: ConnectionInfoTreeData
    ): Promise<vscode.TreeItem> {
        const item = new vscode.TreeItem(element.provider)
        const client = await this.state.host.server.client()
        const res = await client.getLanguageModelConfiguration(
            element.provider + ":*",
            { token: false }
        )
        if (res) {
            item.description = res.base || "?"
            item.tooltip = YAMLStringify(res)
            item.command = <vscode.Command>{
                command: "vscode.open",
                arguments: [this.state.host.toUri("./.env")],
            }
        }
        return item
    }
    getChildren(
        element?: ConnectionInfoTreeData
    ): vscode.ProviderResult<ConnectionInfoTreeData[]> {
        if (!element) return MODEL_PROVIDERS.map(({ id }) => ({ provider: id }))
        return undefined
    }

    private _onDidChangeTreeData: vscode.EventEmitter<
        void | ConnectionInfoTreeData | ConnectionInfoTreeData[]
    > = new vscode.EventEmitter<
        void | ConnectionInfoTreeData | ConnectionInfoTreeData[]
    >()
    readonly onDidChangeTreeData: vscode.Event<
        void | ConnectionInfoTreeData | ConnectionInfoTreeData[]
    > = this._onDidChangeTreeData.event

    refresh(
        treeItem?: ConnectionInfoTreeData | ConnectionInfoTreeData[]
    ): void {
        this._onDidChangeTreeData.fire(treeItem)
    }
}

export function activateConnectionInfoTree(state: ExtensionState) {
    const { context } = state
    const { subscriptions } = context
    const treeDataProvider = new ConnectionInfoTreeDataProvider(state)
    const treeView = vscode.window.createTreeView("genaiscript.connections", {
        treeDataProvider,
    })
    subscriptions.push(treeView)
}
