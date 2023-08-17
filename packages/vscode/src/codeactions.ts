import * as vscode from "vscode"
import { ExtensionState } from "./state"
import { fragmentRange } from "./edit"
import { concatArrays } from "coarch-core"
import { createCodeActions } from "./fragmentcommands"

class CodeActionProvider implements vscode.CodeActionProvider {
    constructor(readonly state: ExtensionState) {}

    public static readonly providedCodeActionKinds = [
        vscode.CodeActionKind.QuickFix,
    ]

    async provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range | vscode.Selection,
        context: vscode.CodeActionContext,
        token: vscode.CancellationToken
    ): Promise<(vscode.CodeAction | vscode.Command)[]> {
        // find fragments on the line of the actions
        const prj = this.state.project
        if (!prj) return []

        const file = document.uri.fsPath
        let fragments = this.state.project.allFragments || []
        fragments = fragments.filter(
            (fragment) => fragment.file.filename === file
        )
        fragments = fragments.filter((fragment) =>
            range.intersection(fragmentRange(fragment))
        )
        const fixes = concatArrays(...fragments.map(createCodeActions))
        return fixes
    }
}

export async function activateCodeActions(state: ExtensionState) {
    state.context.subscriptions.push(
        vscode.languages.registerCodeActionsProvider(
            { scheme: "file", language: "markdown", pattern: "**/*.coarch.md" },
            new CodeActionProvider(state),
            {
                providedCodeActionKinds:
                    CodeActionProvider.providedCodeActionKinds,
            }
        )
    )
}
