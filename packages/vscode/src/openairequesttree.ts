import * as vscode from "vscode"
import { ExtensionState } from "./state"
import {
    CHANGE,
    CacheEntry,
    cachedOpenAIRequestPrefix,
    getChatCompletionCache,
} from "coarch-core"
import type { CreateChatCompletionRequest } from "openai"
import { Cache } from "coarch-core"
import { infoUri } from "./markdowndocumentprovider"

type OpenAIRequestTreeNode = CacheEntry<CreateChatCompletionRequest, string>

class OpenAIRequestTreeDataProvider
    implements vscode.TreeDataProvider<OpenAIRequestTreeNode>
{
    cache: Cache<CreateChatCompletionRequest, string>
    constructor(readonly state: ExtensionState) {
        this.cache = getChatCompletionCache()
        this.cache.addEventListener(CHANGE, () => this.refresh())
    }

    async getTreeItem(
        element: OpenAIRequestTreeNode
    ): Promise<vscode.TreeItem> {
        const { sha, key, val } = element
        const item = new vscode.TreeItem(
            sha,
            vscode.TreeItemCollapsibleState.None
        )
        item.id = sha
        item.command = {
            command: "markdown.showPreview",
            arguments: [infoUri(cachedOpenAIRequestPrefix + sha + ".md")],
            title: "Show Preview",
        }
        return item
    }

    async getChildren(
        element?: OpenAIRequestTreeNode | undefined
    ): Promise<OpenAIRequestTreeNode[]> {
        if (!element) {
            const entries = await this.cache.entries()
            return entries
        }
        return undefined
    }

    async resolveTreeItem?(
        item: vscode.TreeItem,
        element: OpenAIRequestTreeNode,
        token: vscode.CancellationToken
    ) {
        return item
    }

    private _onDidChangeTreeData: vscode.EventEmitter<
        void | OpenAIRequestTreeNode | OpenAIRequestTreeNode[]
    > = new vscode.EventEmitter<
        void | OpenAIRequestTreeNode | OpenAIRequestTreeNode[]
    >()
    readonly onDidChangeTreeData: vscode.Event<
        void | OpenAIRequestTreeNode | OpenAIRequestTreeNode[]
    > = this._onDidChangeTreeData.event

    refresh(treeItem?: OpenAIRequestTreeNode | OpenAIRequestTreeNode[]): void {
        this._onDidChangeTreeData.fire(treeItem)
    }
}

export function activateOpenAIRequestTreeDataProvider(state: ExtensionState) {
    const { context } = state
    const { subscriptions } = context
    const treeDataProvider = new OpenAIRequestTreeDataProvider(state)
    const treeView = vscode.window.createTreeView("coarch.openai.requests", {
        treeDataProvider,
    })
    subscriptions.push(treeView)
}
