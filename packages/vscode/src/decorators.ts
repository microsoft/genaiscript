import * as vscode from "vscode"
import { CHANGE, ExtensionState } from "./state"
import { fragmentRange, toRange } from "./edit"
import { fragmentIdRange } from "coarch-core"

export function activateDecorators(state: ExtensionState) {
    const { context } = state
    const { subscriptions } = context
    const fragmentIdBeforeColor = new vscode.ThemeColor(
        "coarch.fragment.id.before"
    )
    const fragmentIdBorderColor = new vscode.ThemeColor(
        "coarch.fragment.id.border"
    )
    const fragmentIdHighlight = vscode.window.createTextEditorDecorationType({
        isWholeLine: false,
        // gutterIconPath: context.asAbsolutePath("images/robot.svg"),
        light: {
            border: "1px dotted",
            borderColor: fragmentIdBorderColor,
            borderRadius: "5px",
            opacity: "0.4",
            before: {
                fontWeight: "lighter",
                color: fragmentIdBeforeColor,
            },
        },
        dark: {
            border: "1px dotted",
            borderColor: fragmentIdBorderColor,
            borderRadius: "5px",
            opacity: "0.4",
            before: {
                fontWeight: "lighter",
                color: fragmentIdBeforeColor,
            },
        },
    })
    subscriptions.push(fragmentIdHighlight)

    function decorate(editor: vscode.TextEditor) {
        if (!editor) return
        const file = editor.document.uri.fsPath
        const fragments = state.project.allFragments.filter(
            (fragment) => fragment.file.filename === file
        )
        const { computing: aiComputing, fragments: aiFragments } =
            state.aiRequest || {}
        const decorations: vscode.DecorationOptions[] = []
        for (const fragment of fragments) {
            const { state } = fragment
            const idRange = fragmentIdRange(fragment)
            const computing = aiComputing && aiFragments?.includes(fragment)
            const sync = state === "sync"

            const selfarg = encodeURIComponent(JSON.stringify(fragment.fullId))
            let links =
                fragment.applicableTemplates().length > 0
                    ? `- [AI Action](command:coarch.fragment.prompt?${selfarg})\n`
                    : ""
            links += `- [Show in tree](command:coarch.fragment.reveal?${selfarg})\n`
            let md = `CoArch ${sync ? "(audited)" : "(not audited)"}\n\n---\n\n`

            const others = fragment.file.project.fragmentById[fragment.id]
            for (const other of others ?? []) {
                if (other === fragment) continue
                if (other.file.isStructured) md += other.text + "\n\n"
                const arg = encodeURIComponent(JSON.stringify(other.fullId))
                links += `- [${other.file.relativeName()}](command:coarch.fragment.navigate?${arg})\n`
            }

            if (idRange) {
                const hoverMessage = new vscode.MarkdownString(md + links)
                hoverMessage.isTrusted = true
                decorations.push({
                    range: toRange(idRange),
                    renderOptions: {},
                    hoverMessage,
                })
            } else {
                /*
                decorations.push({
                    range: fragmentRange(fragment),
                    renderOptions: {
                        before: {
                            fontWeight: computing ? "bold" : undefined,
                            contentText: computing
                                ? "* "
                                : sync
                                ? undefined
                                : "⚠ ",
                        },
                    },
                    hoverMessage: computing
                        ? "Prompting..."
                        : sync
                        ? "CoArch - Synced"
                        : "CoArch - Not synced",
                });
                */
            }
        }

        editor.setDecorations(fragmentIdHighlight, decorations)
    }

    function decorateDocument(e: vscode.TextDocument) {
        const openEditor = vscode.window.visibleTextEditors.find(
            (editor) => editor.document.uri === e.uri
        )
        if (openEditor) decorate(openEditor)
    }

    subscriptions.push(
        vscode.workspace.onDidOpenTextDocument((e) => {
            decorateDocument(e)
        }),
        vscode.window.onDidChangeActiveTextEditor((e) => {
            decorate(e)
        }),
        vscode.workspace.onWillSaveTextDocument((e) => {
            decorateDocument(e.document)
        })
    )

    state.addEventListener(CHANGE, () => {
        vscode.window.visibleTextEditors.forEach((e) => {
            decorate(e)
        })
    })
}
