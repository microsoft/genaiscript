import * as vscode from "vscode"
import { ExtensionState } from "./state"
import { Fragment } from "coarch-core"

class CodeActionProvider implements vscode.CodeActionProvider {
    constructor(readonly state: ExtensionState) {}

    public static readonly providedCodeActionKinds = [
        vscode.CodeActionKind.QuickFix,
    ]

    private createCodeActions(fragment: Fragment): vscode.CodeAction[] {
        const templates = fragment?.applicableTemplates()
        if (!templates?.length) return []

        const action = new vscode.CodeAction(
            `Run GPTool...`,
            vscode.CodeActionKind.QuickFix
        )
        action.command = <vscode.Command>{
            command: "coarch.fragment.prompt",
            tooltip: "Apply a GPTool script to this file.",
            arguments: [fragment],
        }
        const filename = fragment.file.filename
        const history = Array.from(
            new Set(
                this.state.requestHistory
                    .filter((e) => filename === e.filename)
                    .map((e) =>
                        this.state.project.templates.find(
                            (k) => k.id === e.template
                        )
                    )
                    .filter((t) => !!t)
                    .reverse()
            ).values()
        )
            .slice(0, 3)
            .map((t) => {
                const a = new vscode.CodeAction(
                    `Run '${t.title}'`,
                    vscode.CodeActionKind.QuickFix
                )
                a.command = <vscode.Command>{
                    command: "coarch.fragment.prompt",
                    tooltip: `Apply ${t.title} to this file.`,
                    arguments: [fragment, t],
                }
                return a
            })

        return [action, ...history]
    }

    async provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range | vscode.Selection,
        context: vscode.CodeActionContext,
        token: vscode.CancellationToken
    ): Promise<(vscode.CodeAction | vscode.Command)[]> {
        // find fragments on the line of the actions
        const prj = this.state.project
        if (!prj) return []

        const filename = document.uri.fsPath
        const file = this.state.project.rootFiles.find(
            (f) => f.filename === filename
        )
        const fragment = file?.roots?.[0]
        const fixes = this.createCodeActions(fragment)
        return fixes
    }
}

export async function activateCodeActions(state: ExtensionState) {
    state.context.subscriptions.push(
        vscode.languages.registerCodeActionsProvider(
            { scheme: "file", language: "markdown", pattern: "**/*.gpspec.md" },
            new CodeActionProvider(state),
            {
                providedCodeActionKinds:
                    CodeActionProvider.providedCodeActionKinds,
            }
        )
    )
}
