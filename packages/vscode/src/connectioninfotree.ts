import * as vscode from "vscode"
import { ExtensionState } from "./state"
import { YAMLStringify } from "../../core/src/yaml"
import {
    ResolvedLanguageModelConfiguration,
    ServerEnvResponse,
} from "../../core/src/server/messages"

class ConnectionInfoTreeDataProvider
    implements vscode.TreeDataProvider<ResolvedLanguageModelConfiguration>
{
    private _info: ServerEnvResponse | undefined

    constructor(readonly state: ExtensionState) {
        this.fetchConnections()
    }

    private async fetchConnections() {
        const client = await this.state.host.server.client()
        this._info = await client.infoEnv()
        this.refresh()
    }

    async getTreeItem(
        element: ResolvedLanguageModelConfiguration
    ): Promise<vscode.TreeItem> {
        const item = new vscode.TreeItem(element.provider)
        item.collapsibleState = vscode.TreeItemCollapsibleState.None
        item.description = element.base || ""
        item.tooltip = YAMLStringify(element.source)
        item.command = <vscode.Command>{
            command: "vscode.open",
            arguments: [
                this.state.host.toUri(
                    "https://microsoft.github.io/genaiscript/getting-started/configuration/#" +
                        element.provider
                ),
            ],
        }
        return item
    }

    getChildren(
        element?: ResolvedLanguageModelConfiguration
    ): vscode.ProviderResult<ResolvedLanguageModelConfiguration[]> {
        const providers = this._info?.providers || []
        providers.sort((a, b) => (a.token ? 1 : 0) - (b.token ? 1 : 0))
        if (!element) return providers
        return undefined
    }

    private _onDidChangeTreeData: vscode.EventEmitter<
        | void
        | ResolvedLanguageModelConfiguration
        | ResolvedLanguageModelConfiguration[]
    > = new vscode.EventEmitter<
        | void
        | ResolvedLanguageModelConfiguration
        | ResolvedLanguageModelConfiguration[]
    >()
    readonly onDidChangeTreeData: vscode.Event<
        | void
        | ResolvedLanguageModelConfiguration
        | ResolvedLanguageModelConfiguration[]
    > = this._onDidChangeTreeData.event

    refresh(
        treeItem?:
            | ResolvedLanguageModelConfiguration
            | ResolvedLanguageModelConfiguration[]
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
