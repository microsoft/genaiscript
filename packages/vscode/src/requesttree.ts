import * as vscode from "vscode"
import { ExtensionState } from "./state"
import {
    CHANGE,
    CacheEntry,
    cachedRequestPrefix,
    getChatCompletionCache,
} from "coarch-core"
import type { CreateChatCompletionRequest } from "openai"
import { Cache } from "coarch-core"
import { infoUri } from "./markdowndocumentprovider"

type RequestTreeNode = CacheEntry<CreateChatCompletionRequest, string>

class RequestTreeDataProvider
    implements vscode.TreeDataProvider<RequestTreeNode>
{
    cache: Cache<CreateChatCompletionRequest, string>
    constructor(readonly state: ExtensionState) {
        this.cache = getChatCompletionCache()
        this.cache.addEventListener(CHANGE, () => this.refresh())
    }

    async getTreeItem(element: RequestTreeNode): Promise<vscode.TreeItem> {
        const { sha, key, val } = element
        const item = new vscode.TreeItem(
            sha,
            vscode.TreeItemCollapsibleState.None
        )
        item.id = sha
        item.command = {
            command: "markdown.showPreview",
            arguments: [infoUri(cachedRequestPrefix + sha + ".md")],
            title: "Show Preview",
        }
        return item
    }

    async getChildren(
        element?: RequestTreeNode | undefined
    ): Promise<RequestTreeNode[]> {
        if (!element) {
            const entries = await this.cache.entries()
            return entries
        }
        return undefined
    }

    async resolveTreeItem?(
        item: vscode.TreeItem,
        element: RequestTreeNode,
        token: vscode.CancellationToken
    ) {
        return item
    }

    private _onDidChangeTreeData: vscode.EventEmitter<
        void | RequestTreeNode | RequestTreeNode[]
    > = new vscode.EventEmitter<void | RequestTreeNode | RequestTreeNode[]>()
    readonly onDidChangeTreeData: vscode.Event<
        void | RequestTreeNode | RequestTreeNode[]
    > = this._onDidChangeTreeData.event

    refresh(treeItem?: RequestTreeNode | RequestTreeNode[]): void {
        this._onDidChangeTreeData.fire(treeItem)
    }
}

export function activateRequestTreeDataProvider(state: ExtensionState) {
    const { context } = state
    const { subscriptions } = context
    const treeDataProvider = new RequestTreeDataProvider(state)
    const treeView = vscode.window.createTreeView("coarch.openai.requests", {
        treeDataProvider,
    })
    subscriptions.push(treeView)
}
