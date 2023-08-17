import * as vscode from "vscode"
import { AI_REQUEST_CHANGE, ExtensionState } from "./state"
import { showMarkdownPreview } from "./markdown"
import { builtinPrefix, defaultPrompts } from "coarch-core"

const SCHEME = "coarch-md"

class MarkdownTextDocumentContentProvider
    implements vscode.TextDocumentContentProvider
{
    constructor(readonly state: ExtensionState) {
        this.state.addEventListener(AI_REQUEST_CHANGE, () => {
            ;[
                "airequest.dialogtext.md",
                "airequest.text.md",
                "airequest.info.md",
                "airesponse.text.md",
                "airesponse.info.md",
            ]
                .map((path) => infoUri(path))
                .forEach((uri) => {
                    this._onDidChange.fire(uri)
                })
        })
    }

    private _onDidChange: vscode.EventEmitter<vscode.Uri> =
        new vscode.EventEmitter<vscode.Uri>()
    readonly onDidChange: vscode.Event<vscode.Uri> = this._onDidChange.event

    async provideTextDocumentContent(
        uri: vscode.Uri,
        token: vscode.CancellationToken
    ): Promise<string> {
        const aiRequest = this.state.aiRequest
        const res = aiRequest?.response
        switch (uri.path) {
            case "airequest.dialogtext.md":
                return res?.dialogText
            case "airequest.text.md":
                return res?.text
            case "airequest.info.md":
                return res?.info
            case "airesponse.text.md":
                return res?.text
            case "airesponse.info.md":
                return res?.info
        }
        if (uri.path.startsWith(builtinPrefix)) {
            const id = uri.path
                .slice(builtinPrefix.length)
                .replace(/\.prompt\.js$/, "")
            return defaultPrompts[id] ?? `No such builtin prompt: ${id}`
        }
        return ""
    }
}

export function infoUri(path: string) {
    return vscode.Uri.from({ scheme: SCHEME, path })
}

export function builtinPromptUri(id: string) {
    return vscode.Uri.from({
        scheme: SCHEME,
        path: builtinPrefix + id + ".prompt.js",
    })
}

export function activateMarkdownTextDocumentContentProvider(
    state: ExtensionState
) {
    const { context } = state
    const { subscriptions } = context
    const provider = new MarkdownTextDocumentContentProvider(state)
    subscriptions.push(
        vscode.workspace.registerTextDocumentContentProvider(SCHEME, provider),
        vscode.commands.registerCommand(
            "coarch.request.open",
            async (id: string) => {
                if (state.aiRequest) {
                    const uri = infoUri(id || "airesponse.info.md")
                    await showMarkdownPreview(uri)
                }
            }
        )
    )
}
