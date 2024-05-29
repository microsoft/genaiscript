import * as vscode from "vscode" // Import the 'vscode' module

import { ExtensionState } from "./state"
import {
    GENAI_JS_GLOB,
    LanguageModelInfo,
    MODEL_PROVIDERS,
    logError,
    logVerbose,
    resolveLanguageModel,
} from "genaiscript-core"

export async function activateModelCompletionProvider(state: ExtensionState) {
    const { context } = state
    const { subscriptions } = context

    const providerCompletionProvider: vscode.CompletionItemProvider<vscode.CompletionItem> =
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

                return MODEL_PROVIDERS.map(({ id, detail, url }) => {
                    const completionItem = new vscode.CompletionItem(id + ":")
                    completionItem.kind = vscode.CompletionItemKind.Constant
                    completionItem.insertText = id
                    completionItem.detail = detail
                    if (url)
                        completionItem.documentation =
                            new vscode.MarkdownString(`[Docs](${url})`)
                    completionItem.commitCharacters = [":", "."]
                    return completionItem
                })
            },
        }

    const modelCompletionProvider: vscode.CompletionItemProvider<vscode.CompletionItem> =
        {
            provideCompletionItems: async (document, position, token) => {
                const range = new vscode.Range(
                    position.line,
                    Math.max(0, position.character - 40),
                    position.line,
                    position.character
                )
                const lastChars = document.getText(range)
                const m =
                    /\s[`'"]?model[`'"]?\s{0,10}:\s{0,10}[`'"](?<provider>[a-z0-9_\-]+):$/i.exec(
                        lastChars
                    )
                if (!m) return []

                const provider = m.groups.provider
                const modelid = provider + ":*"
                const lm = resolveLanguageModel({ model: modelid })
                if (!lm?.listModels) return []
                try {
                    const cfg =
                        await state.host.getLanguageModelConfiguration(modelid)
                    if (token.isCancellationRequested || !cfg) return []
                    console.log(`resolving models for ${provider}`)

                    let models: LanguageModelInfo[]
                    try {
                        models = await lm.listModels(cfg)
                    } catch (e) {
                        logVerbose(e)
                        models = []
                    }
                    if (token.isCancellationRequested) return []
                    return models.map((model) => {
                        const completionItem = new vscode.CompletionItem(
                            model.id
                        )
                        completionItem.kind = vscode.CompletionItemKind.Constant
                        completionItem.detail = model.details
                        if (model.url)
                            completionItem.documentation =
                                new vscode.MarkdownString(
                                    `[${model.url}](${model.url})`
                                )
                        return completionItem
                    })
                } catch (e) {
                    logError(e)
                    return []
                }
            },
        }

    // ollama:...
    subscriptions.push(
        vscode.languages.registerCompletionItemProvider(
            {
                scheme: "file",
                pattern: GENAI_JS_GLOB,
            },
            providerCompletionProvider,
            '"',
            "'",
            "`"
        ),
        vscode.languages.registerCompletionItemProvider(
            {
                scheme: "file",
                pattern: GENAI_JS_GLOB,
            },
            modelCompletionProvider,
            ":"
        )
    )
}
