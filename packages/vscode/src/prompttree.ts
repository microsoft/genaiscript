import * as vscode from "vscode"
import { ExtensionState } from "./state"
import { CHANGE } from "../../core/src/constants"
import { groupBy } from "../../core/src/util"
import { templateGroup } from "../../core/src/ast"
import { MarkdownStringify } from "../../core/src/markdown"

type PromptTreeNode = string | PromptScript

class PromptTreeDataProvider
    implements vscode.TreeDataProvider<PromptTreeNode>
{
    constructor(readonly state: ExtensionState) {
        this.state.addEventListener(CHANGE, () => {
            this.refresh()
        })
    }

    async getTreeItem(element: PromptTreeNode): Promise<vscode.TreeItem> {
        if (typeof element === "string") {
            const item = new vscode.TreeItem(
                element,
                vscode.TreeItemCollapsibleState.Collapsed
            )
            item.id = `genaiscript.promptCategory.${element}`
            return item
        } else {
            const {
                id,
                filename,
                title,
                description = "",
                system = [],
                text,
                defTools,
                jsSource,
                ...rest
            } = element
            const ai = this.state.aiRequest
            const { computing, options, progress } = ai || {}
            const { template } = options || {}
            const generating = computing && template === element
            const item = new vscode.TreeItem(
                title,
                vscode.TreeItemCollapsibleState.None
            )
            item.id = `genaiscript.prompts.${filename || id}`
            item.contextValue = element.filename ? `prompt` : `prompt.builtin`
            item.description = generating
                ? `${progress?.tokensSoFar || 0} tokens`
                : id
            item.command = {
                command: "genaiscript.prompt.navigate",
                title: "Navigate to...",
                arguments: [element],
            }
            item.tooltip = new vscode.MarkdownString(
                `
## ${title} \`${id}\`

${description}

- filename: \`${filename || "builtin"}\`
${MarkdownStringify(rest, { quoteValues: true })}
`,
                true
            )

            if (generating) item.iconPath = new vscode.ThemeIcon(`loading~spin`)
            else if (element.unlisted)
                item.iconPath = new vscode.ThemeIcon("code")
            else if (!element.filename)
                item.iconPath = new vscode.ThemeIcon("lightbulb")
            else item.iconPath = new vscode.ThemeIcon("lightbulb-autofix")
            return item
        }
    }

    async getChildren(
        element?: PromptTreeNode | undefined
    ): Promise<PromptTreeNode[]> {
        const project = this.state.project
        const templates = project?.scripts || []
        if (!element) {
            if (!templates.length) return []
            const groups = Object.keys(groupBy(templates, templateGroup))
            return [...groups.filter((t) => t !== "system"), "system"]
        } else if (typeof element === "string") {
            const templates = this.state.project?.scripts || []
            return templates.filter((t) => templateGroup(t) === element)
        } else {
            return undefined
        }
    }

    private _onDidChangeTreeData: vscode.EventEmitter<
        void | PromptTreeNode | PromptTreeNode[]
    > = new vscode.EventEmitter<void | PromptTreeNode | PromptTreeNode[]>()
    readonly onDidChangeTreeData: vscode.Event<
        void | PromptTreeNode | PromptTreeNode[]
    > = this._onDidChangeTreeData.event

    refresh(treeItem?: PromptTreeNode | PromptTreeNode[]): void {
        this._onDidChangeTreeData.fire(treeItem)
    }
}

export function activatePromptTreeDataProvider(state: ExtensionState) {
    const { context } = state
    const { subscriptions } = context
    const treeDataProvider = new PromptTreeDataProvider(state)
    const treeView = vscode.window.createTreeView("genaiscript.prompts", {
        treeDataProvider,
    })
    subscriptions.push(treeView)
}
