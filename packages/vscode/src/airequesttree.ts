import * as vscode from "vscode"
import {
    AIRequestSnapshot,
    AIRequestSnapshotKey,
    ExtensionState,
} from "./state"
import { CHANGE, CacheEntry, cachedAIRequestPrefix } from "coarch-core"
import { Cache } from "coarch-core"
import { infoUri } from "./markdowndocumentprovider"

type AIRequestTreeNode = CacheEntry<AIRequestSnapshotKey, AIRequestSnapshot>

class AIRequestTreeDataProvider
    implements vscode.TreeDataProvider<AIRequestTreeNode>
{
    cache: Cache<AIRequestSnapshotKey, AIRequestSnapshot>
    constructor(readonly state: ExtensionState) {
        this.cache = state.aiRequestCache()
        this.cache.addEventListener(CHANGE, () => this.refresh())
    }

    async getTreeItem(element: AIRequestTreeNode): Promise<vscode.TreeItem> {
        const { sha, key } = element
        const item = new vscode.TreeItem(
            key.template.title,
            vscode.TreeItemCollapsibleState.None
        )
        item.description = key.fragment.fullId
        item.id = sha
        item.command = {
            command: "markdown.showPreview",
            arguments: [infoUri(cachedAIRequestPrefix + sha + ".md")],
            title: "Show Trace",
        }
        return item
    }

    async getChildren(
        element?: AIRequestTreeNode | undefined
    ): Promise<AIRequestTreeNode[]> {
        if (!element) {
            const entries = await this.cache.entries()
            return entries
        }
        return undefined
    }

    async resolveTreeItem?(
        item: vscode.TreeItem,
        element: AIRequestTreeNode,
        token: vscode.CancellationToken
    ) {
        return item
    }

    private _onDidChangeTreeData: vscode.EventEmitter<
        void | AIRequestTreeNode | AIRequestTreeNode[]
    > = new vscode.EventEmitter<
        void | AIRequestTreeNode | AIRequestTreeNode[]
    >()
    readonly onDidChangeTreeData: vscode.Event<
        void | AIRequestTreeNode | AIRequestTreeNode[]
    > = this._onDidChangeTreeData.event

    refresh(treeItem?: AIRequestTreeNode | AIRequestTreeNode[]): void {
        this._onDidChangeTreeData.fire(treeItem)
    }
}

export function activateAIRequestTreeDataProvider(state: ExtensionState) {
    const { context } = state
    const { subscriptions } = context
    const treeDataProvider = new AIRequestTreeDataProvider(state)
    const treeView = vscode.window.createTreeView("coarch.prompts.requests", {
        treeDataProvider,
    })
    subscriptions.push(treeView)
}
