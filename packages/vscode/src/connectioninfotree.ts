import * as vscode from "vscode"
import { ExtensionState } from "./state"
import { YAMLStringify } from "../../core/src/yaml"
import {
    LanguageModelInfo,
    ResolvedLanguageModelConfiguration,
    ServerEnvResponse,
} from "../../core/src/server/messages"
import { deleteUndefinedValues } from "../../core/src/cleaners"
import { registerCommand } from "./commands"

interface ConnectionInfoTreeData {
    provider?: ResolvedLanguageModelConfiguration
    model?: LanguageModelInfo
}

class ConnectionInfoTreeDataProvider
    implements vscode.TreeDataProvider<ConnectionInfoTreeData>
{
    private _info: ServerEnvResponse | undefined

    constructor(readonly state: ExtensionState) {
        const { context } = state
        const { subscriptions } = context

        subscriptions.push(
            registerCommand("genaiscript.connections.refresh", async () => {
                await this.fetchConnections()
            })
        )
    }

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
            const tt: vscode.MarkdownString = (item.tooltip =
                new vscode.MarkdownString(`\`${element.provider.provider}:${id}\`

${details}

${url ? `[${url}](${url})` : ""}
`))
            tt.isTrusted = true
            return item
        } else if (element.provider) {
            const { provider, base, models, error, ...rest } = element.provider
            const item = new vscode.TreeItem(provider)
            item.collapsibleState = models?.length
                ? vscode.TreeItemCollapsibleState.Collapsed
                : vscode.TreeItemCollapsibleState.None
            item.description = base || ""
            const docsUrl =
                "https://microsoft.github.io/genaiscript/getting-started/configuration/#" +
                provider
            if (error) item.iconPath = new vscode.ThemeIcon("error")
            item.tooltip = YAMLStringify(
                deleteUndefinedValues({ error, ...rest })
            )
            item.command = <vscode.Command>{
                command: "simpleBrowser.show",
                arguments: [this.state.host.toUri(docsUrl)],
            }
            return item
        }
        return undefined
    }

    async getChildren(
        element?: ConnectionInfoTreeData
    ): Promise<ConnectionInfoTreeData[]> {
        if (!this._info) await this.fetchConnections()

        if (!element) {
            const providers = this._info?.providers || []
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
