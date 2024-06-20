import * as vscode from "vscode"
import { ExtensionState } from "./state"
import {
    CHANGE,
    CacheEntry,
    CreateChatCompletionRequest,
    CACHE_LLMREQUEST_PREFIX,
    getChatCompletionCache,
    ChatCompletationRequestCache,
    ChatCompletationRequestCacheValue,
} from "genaiscript-core"
import { infoUri } from "./markdowndocumentprovider"

type LLMRequestTreeNode = CacheEntry<
    CreateChatCompletionRequest,
    ChatCompletationRequestCacheValue
>

class LLMRequestTreeDataProvider
    implements vscode.TreeDataProvider<LLMRequestTreeNode>
{
    cache: ChatCompletationRequestCache
    constructor(readonly state: ExtensionState) {
        this.cache = getChatCompletionCache()
        this.cache.addEventListener(CHANGE, () => this.refresh())
    }

    async getTreeItem(element: LLMRequestTreeNode): Promise<vscode.TreeItem> {
        const { sha, key, val } = element
        const item = new vscode.TreeItem(
            sha,
            vscode.TreeItemCollapsibleState.None
        )
        item.id = sha
        item.command = {
            command: "markdown.showPreview",
            arguments: [infoUri(CACHE_LLMREQUEST_PREFIX + sha + ".md")],
            title: "Show Preview",
        }
        return item
    }

    async getChildren(
        element?: LLMRequestTreeNode | undefined
    ): Promise<LLMRequestTreeNode[]> {
        if (!element) {
            const entries = await this.cache.entries()
            return entries
        }
        return undefined
    }

    async resolveTreeItem?(
        item: vscode.TreeItem,
        element: LLMRequestTreeNode,
        token: vscode.CancellationToken
    ) {
        return item
    }

    private _onDidChangeTreeData: vscode.EventEmitter<
        void | LLMRequestTreeNode | LLMRequestTreeNode[]
    > = new vscode.EventEmitter<
        void | LLMRequestTreeNode | LLMRequestTreeNode[]
    >()
    readonly onDidChangeTreeData: vscode.Event<
        void | LLMRequestTreeNode | LLMRequestTreeNode[]
    > = this._onDidChangeTreeData.event

    refresh(treeItem?: LLMRequestTreeNode | LLMRequestTreeNode[]): void {
        this._onDidChangeTreeData.fire(treeItem)
    }
}

export function activateLLMRequestTreeDataProvider(state: ExtensionState) {
    const { context } = state
    const { subscriptions } = context
    const treeDataProvider = new LLMRequestTreeDataProvider(state)
    const treeView = vscode.window.createTreeView("genaiscript.llm.requests", {
        treeDataProvider,
    })
    subscriptions.push(treeView)
}
