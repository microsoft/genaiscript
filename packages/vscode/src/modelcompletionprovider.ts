import * as vscode from "vscode" // Import the 'vscode' module

import { ExtensionState } from "./state"
import {
    LanguageModelConfiguration,
    LanguageModelInfo,
    MODEL_PROVIDERS,
    logError,
    logVerbose,
    resolveLanguageModel,
} from "genaiscript-core"

export async function activateModelCompletionProvider(state: ExtensionState) {
    const { context } = state
    const { subscriptions } = context

    const modelCompletionProvider: vscode.CompletionItemProvider<vscode.CompletionItem> =
        {
            provideCompletionItems: async (document, position, token) => {
                const range = new vscode.Range(
                    position.line,
                    Math.max(0, position.character - 30),
                    position.line,
                    position.character
                )
                const lastChars = document.getText(range)
                if (
                    !/\s[`'"]?model[`'"]?\s{0,10}:\s{0,10}[`'"]$/i.test(
                        lastChars
                    )
                )
                    return []

                try {
                    const completions: vscode.CompletionItem[] = []
                    for (const provider of MODEL_PROVIDERS) {
                        const modelid = provider + ":*"
                        const lm = resolveLanguageModel({ model: modelid })
                        if (!lm.listModels) continue

                        const cfg =
                            await state.host.getLanguageModelConfiguration(
                                modelid
                            )
                        if (token.isCancellationRequested) return []
                        if (!cfg) continue

                        let models: LanguageModelInfo[]
                        try {
                            models = await lm.listModels(cfg)
                        } catch (e) {
                            logVerbose(e)
                            models = []
                        }
                        if (token.isCancellationRequested) return []
                        if (models.length)
                            completions.push(
                                ...models.map((model) => {
                                    const completionItem =
                                        new vscode.CompletionItem(model.id)
                                    completionItem.kind =
                                        vscode.CompletionItemKind.Constant
                                    completionItem.detail = model.details
                                    if (model.url)
                                        completionItem.documentation =
                                            new vscode.MarkdownString(
                                                `[${model.url}](${model.url})`
                                            )
                                    return completionItem
                                })
                            )
                    }

                    return completions
                } catch (e) {
                    logError(e)
                    return []
                }
            },
            resolveCompletionItem: async (item, token) => {
                return item
            },
        }

    // ollama:...
    subscriptions.push(
        vscode.languages.registerCompletionItemProvider(
            {
                scheme: "file",
                language: "javascript",
                pattern: "**/*.genai.js",
            },
            modelCompletionProvider,
            '"',
            "'",
            "`"
        )
    )
}
