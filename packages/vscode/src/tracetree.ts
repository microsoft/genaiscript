import * as vscode from "vscode"
import { ExtensionState } from "./state"
import { CHANGE, DetailsNode, parseDetailsTree } from "genaiscript-core"

type TraceNode = string | DetailsNode

class TraceTree implements vscode.TreeDataProvider<TraceNode> {
    constructor(readonly state: ExtensionState) {
        this.state.addEventListener(CHANGE, () => this.refresh())
    }

    getTreeItem(
        element: TraceNode
    ): vscode.TreeItem | Thenable<vscode.TreeItem> {
        if (typeof element === "string") return new vscode.TreeItem(element)
        return element
    }

    getChildren(element?: TraceNode): vscode.ProviderResult<TraceNode[]> {
        if (element === undefined)
            element = parseDetailsTree(this.state.aiRequest?.trace?.content)
        if (typeof element === "object") return element?.content
        return undefined
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
    const treeDataProvider = new TraceTree(state)
    const treeView = vscode.window.createTreeView("genaiscript.trace", {
        treeDataProvider,
    })
    subscriptions.push(treeView)
}
