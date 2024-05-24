import * as vscode from "vscode" // Import the 'vscode' module

import { ExtensionState } from "./state"
import { listLocalModels } from "genaiscript-core"

export async function activateModelCompletionProvider(state: ExtensionState) {
    const { context } = state
    const { subscriptions } = context

    const ollamaCompletionProvider: vscode.CompletionItemProvider<vscode.CompletionItem> =
        {
            provideCompletionItems: async (document, position, token) => {
                // get the last 10 characters before the cursor
                const range = new vscode.Range(
                    position.line,
                    Math.max(0, position.character - "'ollama:".length),
                    position.line,
                    position.character
                )
                const lastChars = document.getText(range)
                if (!/^[`'"]ollama:$/i.test(lastChars)) return []

                try {
                    const models = await listLocalModels()
                    if (token.isCancellationRequested) return []
                    return models.map((model) => {
                        const url = `https://ollama.com/library/${model.name}`
                        const completionItem = new vscode.CompletionItem(
                            model.name
                        )
                        completionItem.kind = vscode.CompletionItemKind.Constant
                        completionItem.detail = `${model.name}, ${model.details.parameter_size}`
                        completionItem.documentation =
                            new vscode.MarkdownString(`${Math.ceil(model.size / 1e6)}Mb, ${model.details.family}
                            
- [${url}](${url})`)
                        return completionItem
                    })
                } catch (e) {
                    return []
                }
            },
            resolveCompletionItem: async (item, token) => {
                return item
            }
        }

    // ollama:...
    subscriptions.push(
        vscode.languages.registerCompletionItemProvider(
            {
                scheme: "file",
                language: "javascript",
                pattern: "**/*.genai.js",
            },
            ollamaCompletionProvider,
            ":"
        )
    )
}
