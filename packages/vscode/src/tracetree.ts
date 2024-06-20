import * as vscode from "vscode"
import { ExtensionState } from "./state"
import {
    CHANGE,
    DetailsNode,
    ItemNode,
    TRACE_NODE_PREFIX,
    TraceNode,
    TraceTree,
    parseTraceTree,
} from "genaiscript-core"
import { infoUri } from "./markdowndocumentprovider"

class TraceTreeDataProvider implements vscode.TreeDataProvider<TraceNode> {
    constructor(readonly state: ExtensionState) {
        this.state.addEventListener(CHANGE, () => this.refresh())
    }

    getTreeItem(
        element: TraceNode
    ): vscode.TreeItem | Thenable<vscode.TreeItem> {
        if (typeof element === "string") {
            const tooltip = new vscode.MarkdownString(element, true)
            tooltip.isTrusted = false // LLM, user generated
            const item = new vscode.TreeItem(element)
            item.tooltip = tooltip
            return item
        } else {
            const item = new vscode.TreeItem(element.label)
            item.id = element.id
            if (element.type === "details") {
                item.collapsibleState =
                    element.content.filter((s) => typeof s !== "string")
                        .length > 0
                        ? vscode.TreeItemCollapsibleState.Collapsed
                        : vscode.TreeItemCollapsibleState.None
                if (
                    item.collapsibleState ===
                    vscode.TreeItemCollapsibleState.None
                )
                    item.command = {
                        command: "markdown.showPreview",
                        arguments: [
                            infoUri(TRACE_NODE_PREFIX + item.id + ".md"),
                        ],
                        title: "Show Preview",
                    }
                if (
                    typeof element.content[0] === "string" &&
                    element.content[0]
                ) {
                    const tooltip = new vscode.MarkdownString(
                        element.content[0] as string,
                        true
                    )
                    tooltip.isTrusted = false // LLM, user generated
                    item.tooltip = tooltip
                }
            } else if (element.type === "item") {
                item.description = element.value?.replace(
                    /\[([^\]]+)\]\([^)]+\)/g,
                    (m, n) => n
                )
                const tooltip = new vscode.MarkdownString(element.value, true)
                tooltip.isTrusted = false // LLM, user generated
                item.tooltip = tooltip
            }
            return item
        }
    }

    getChildren(element?: TraceNode): vscode.ProviderResult<TraceNode[]> {
        if (element === undefined) {
            const tree = this.state.aiRequest?.trace?.tree
            element = tree?.root
        }
        if (!element) return []
        if (typeof element === "string") return undefined
        else if (element.type === "details")
            return element?.content?.filter((s) => typeof s !== "string")
        else return undefined
    }

    private _onDidChangeTreeData: vscode.EventEmitter<
        void | TraceNode | TraceNode[]
    > = new vscode.EventEmitter<void | TraceNode | TraceNode[]>()
    readonly onDidChangeTreeData: vscode.Event<void | TraceNode | TraceNode[]> =
        this._onDidChangeTreeData.event

    refresh(treeItem?: TraceNode | TraceNode[]): void {
        this._onDidChangeTreeData.fire(treeItem)
    }
}

export function activateTraceTreeDataProvider(state: ExtensionState) {
    const { context } = state
    const { subscriptions } = context
    const treeDataProvider = new TraceTreeDataProvider(state)
    const treeView = vscode.window.createTreeView("genaiscript.trace", {
        treeDataProvider,
    })
    subscriptions.push(treeView)
}
