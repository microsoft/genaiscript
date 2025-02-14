import * as vscode from "vscode"
import { ExtensionState } from "./state"
import { infoUri } from "./markdowndocumentprovider"
import { CHANGE, TRACE_NODE_PREFIX } from "../../core/src/constants"
import { TraceNode } from "../../core/src/traceparser"
import { unmarkdown } from "../../core/src/cleaners"

class TraceTreeDataProvider implements vscode.TreeDataProvider<TraceNode> {
    private previewTreeItems: Record<string, vscode.TreeItem> = {}
    private treeItems: Record<string, vscode.TreeItem> = {}

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
            const item = new vscode.TreeItem(unmarkdown(element.label))
            item.id = element.id
            if (element.type === "details") {
                const previousTreeItem = this.previewTreeItems[element.id]
                item.collapsibleState =
                    previousTreeItem?.collapsibleState ??
                    (element.content.filter((s) => typeof s !== "string")
                        .length > 0
                        ? vscode.TreeItemCollapsibleState.Collapsed
                        : vscode.TreeItemCollapsibleState.None)
                item.command = {
                    command: "markdown.showPreview",
                    arguments: [infoUri(TRACE_NODE_PREFIX + item.id + ".md")],
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
                this.treeItems[element.id] = item
            } else if (element.type === "item") {
                item.description = unmarkdown(element.value)
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
        this.previewTreeItems = this.treeItems
        this.treeItems = {}
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
