import * as vscode from "vscode"
import { ExtensionState } from "./state"
import { YAMLStringify } from "../../core/src/yaml"
import {
    LanguageModelInfo,
    ResolvedLanguageModelConfiguration,
    ServerEnvResponse,
} from "../../core/src/server/messages"

interface ConnectionInfoTreeData {
    provider?: ResolvedLanguageModelConfiguration
    model?: LanguageModelInfo
}

class ConnectionInfoTreeDataProvider
    implements vscode.TreeDataProvider<ConnectionInfoTreeData>
{
    private _info: ServerEnvResponse | undefined

    constructor(readonly state: ExtensionState) {}

    private async fetchConnections() {
        const client = await this.state.host.server.client()
        this._info = await client.infoEnv()
        this.refresh()
    }

    async getTreeItem(
        element: ConnectionInfoTreeData
    ): Promise<vscode.TreeItem> {
        if (element.model) {
            const { id, details, url } = element.model
            const item = new vscode.TreeItem(id)
            if (url) {
                const tt: vscode.MarkdownString = (item.tooltip =
                    new vscode.MarkdownString(`${details}

[${url}](${url})
`))
                tt.isTrusted = true
            } else item.tooltip = details
            return item
        } else if (element.provider) {
            const { provider, base, models } = element.provider
            const item = new vscode.TreeItem(provider)
            item.collapsibleState = models?.length
                ? vscode.TreeItemCollapsibleState.Collapsed
                : vscode.TreeItemCollapsibleState.None
            item.description = base || ""
            item.tooltip = YAMLStringify(element.provider)
            item.command = <vscode.Command>{
                command: "simpleBrowser.show",
                arguments: [
                    this.state.host.toUri(
                        "https://microsoft.github.io/genaiscript/getting-started/configuration/#" +
                            provider
                    ),
                ],
            }
            return item
        }
        return undefined
    }

    getChildren(
        element?: ConnectionInfoTreeData
    ): vscode.ProviderResult<ConnectionInfoTreeData[]> {
        if (!this._info) {
            this.fetchConnections()
            return []
        }

        if (!element) {
            const providers = this._info?.providers || []
            providers.sort(
                (a, b) =>
                    (a.error ? 100 : -100) +
                    (a.models?.length ? 1 : 0) -
                    (b.error ? 100 : -100) -
                    (b.models?.length ? 1 : 0)
            )
            return providers.map((provider) => ({ provider }))
        }
        if (element.provider)
            return (
                element.provider.models?.map((model) => ({
                    provider: element.provider,
                    model,
                })) || []
            )
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
