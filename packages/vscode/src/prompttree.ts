import * as vscode from "vscode"
import { CHANGE, ExtensionState } from "./state"
import { PromptTemplate } from "coarch-core"

type PromptTreeNode = string | PromptTemplate

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
            item.id = `coarch.promptCategory.${element}`
            return item
        } else {
            const { id, title, children, text, description = "" } = element
            const ai = this.state.aiRequest
            const { computing, template, progress } = ai || {}
            const generating = computing && template === element
            const item = new vscode.TreeItem(
                title,
                vscode.TreeItemCollapsibleState.None
            )
            item.id = `coarch.prompts.${id}`
            item.contextValue = element.filename ? `prompt` : `prompt.builtin`
            item.description = generating
                ? `${progress?.tokensSoFar || 0} tokens`
                : id
            item.command = {
                command: "coarch.prompt.navigate",
                title: "Navigate to...",
                arguments: [element],
            }
            item.tooltip = new vscode.MarkdownString(
                `
## ${title}

${description}

-  id: \`${id}\`
-  children: ${children || ""}

### Prompt

\`\`\`
${text}
\`\`\`
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
        const templates = this.state.project?.templates || []
        if (!element) {
            // collect and sort all categories
            const cats = new Set<string>()
            templates
                .map((t) => t.categories)
                .forEach((c) => c?.forEach((c) => cats.add(c)))
            const categories: string[] = [...new Set(cats)].sort()
            categories.push("system", "")
            return categories
        } else if (typeof element === "string") {
            const templates = this.state.project?.templates || []
            return templates.filter(
                (t) =>
                    t.categories?.includes(element) ||
                    (element === "system" && /^system\.?/.test(t.id)) ||
                    (!t.categories?.length && element === "")
            )
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

export function activatePrompTreeDataProvider(state: ExtensionState) {
    const { context } = state
    const { subscriptions } = context
    const treeDataProvider = new PromptTreeDataProvider(state)
    const treeView = vscode.window.createTreeView("coarch.prompts", {
        treeDataProvider,
    })
    subscriptions.push(treeView)
}
