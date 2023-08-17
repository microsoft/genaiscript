import * as vscode from "vscode"
import { ExtensionState } from "./state"
import { Fragment } from "coarch-core"
import { fragmentRange } from "./edit"

class FragmentCodeLens extends vscode.CodeLens {
    constructor(readonly fragment: Fragment) {
        super(fragmentRange(fragment))
    }
}

class FragmentCodeLensProvider
    implements vscode.CodeLensProvider<FragmentCodeLens>
{
    constructor(readonly state: ExtensionState) {}
    onDidChangeCodeLenses?: vscode.Event<void>
    async provideCodeLenses(
        document: vscode.TextDocument,
        token: vscode.CancellationToken
    ): Promise<FragmentCodeLens[]> {
        const file = document.uri.fsPath
        const fragments = this.state.project.allFragments.filter(
            (fragment) =>
                fragment.state !== "sync" && fragment.file.filename === file
        )
        return fragments.map((fragment) => new FragmentCodeLens(fragment))
    }

    async resolveCodeLens(
        codeLens: FragmentCodeLens,
        token: vscode.CancellationToken
    ) {
        const fragment = codeLens.fragment
        codeLens.command = {
            title: `CoArch - needs review`,
            command: "coarch.fragment.reveal",
            arguments: [fragment],
            tooltip: "Reveal fragment in CoArch",
        }
        return codeLens
    }
}

export function activateCodeLens(state: ExtensionState) {
    const { context } = state
    const { subscriptions } = context

    const provider = new FragmentCodeLensProvider(state)
    subscriptions.push(
        vscode.languages.registerCodeLensProvider(
            {
                language: "markdown",
                pattern: "**/*.coarch.md",
            },
            provider
        )
    )
}
