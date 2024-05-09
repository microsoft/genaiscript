/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from "vscode"
import { AIRequestOptions, ExtensionState } from "./state"
import {
    LanguageModel,
    GenerationOptions,
    estimateTokens,
    logVerbose,
    parseModelIdentifier,
    APIType,
    MODEL_PROVIDER_OPENAI,
    DOCS_CONFIGURATION_URL,
    MODEL_PROVIDER_OLLAMA,
    MODEL_PROVIDER_AICI,
    updateConnectionConfiguration,
} from "genaiscript-core"
import { isApiProposalEnabled } from "./proposals"
import { openUrlInTab } from "./browser"

export async function pickLanguageModel(
    state: ExtensionState,
    modelId: string
) {
    const models = isLanguageModelsAvailable(state.context)
        ? vscode.lm.languageModels
        : []
    const items: (vscode.QuickPickItem & {
        model?: string
        provider?: string
        apiType?: APIType
    })[] = models.map((model) => ({
        label: model,
        description: `Visual Studio Code Language Model`,
        detail: `Use the language model ${model} through your GitHub Copilot subscription.`,
        model,
    }))
    if (items.length)
        items.push({ kind: vscode.QuickPickItemKind.Separator, label: ".env" })
    items.push(
        {
            label: "OpenAI",
            detail: `Use a personal OpenAI subscription.`,
            provider: MODEL_PROVIDER_OPENAI,
        },
        {
            label: "Azure OpenAI",
            detail: `Use a Azure-hosted OpenAI subscription.`,
            provider: MODEL_PROVIDER_OPENAI,
            apiType: "azure",
        },
        {
            label: "LocalAI",
            description: "https://localai.io/",
            detail: "Use local LLMs instead OpenAI. Requires LocalAI and Docker.",
            provider: MODEL_PROVIDER_OPENAI,
            apiType: "localai",
        },
        {
            label: "Ollama",
            description: "https://ollama.com/",
            detail: "Run a open source LLMs locally. Requires Ollama",
            provider: MODEL_PROVIDER_OLLAMA,
        },
        {
            label: "AICI",
            description: "http://github.com/microsoft/aici",
            detail: "Generate AICI javascript prompts.",
            provider: MODEL_PROVIDER_AICI,
        }
    )

    const cmodel: { model?: string; provider?: string; apiType?: APIType } =
        await vscode.window.showQuickPick<
            vscode.QuickPickItem & {
                model?: string
                provider?: string
                apiType?: APIType
            }
        >(items, {
            title: `Pick a Language Model for ${modelId}`,
        })
    if (cmodel === undefined) return undefined

    const { model, provider, apiType } = cmodel || {}
    if (model) return model
    else {
        await updateConnectionConfiguration(provider, apiType)
        const doc = await vscode.workspace.openTextDocument(
            vscode.Uri.joinPath(state.host.projectUri, ".env")
        )
        await vscode.window.showTextDocument(doc)
        return undefined
    }
}

export function isLanguageModelsAvailable(context: vscode.ExtensionContext) {
    return isApiProposalEnabled(
        context,
        "languageModels",
        "github.copilot-chat"
    )
}

export function configureLanguageModelAccess(
    context: vscode.ExtensionContext,
    options: AIRequestOptions,
    genOptions: GenerationOptions,
    chatModel: string
): void {
    logVerbose("using copilot llm")
    const { template } = options
    const { partialCb, infoCb } = genOptions

    // sanity check
    if (!vscode.lm.languageModels.includes(chatModel))
        throw new Error("Language model not found")

    genOptions.cache = false
    genOptions.languageModel = Object.freeze<LanguageModel>({
        id: "vscode",
        completer: async (req, connection, chatOptions, trace) => {
            const token = new vscode.CancellationTokenSource().token
            const { model, temperature, top_p, seed, ...rest } = req

            trace.itemValue(`script model`, model)
            trace.itemValue(`language model`, chatModel)
            const messages: vscode.LanguageModelChatMessage[] =
                req.messages.map((m) => {
                    switch (m.role) {
                        case "system":
                            return new vscode.LanguageModelChatSystemMessage(
                                m.content
                            )
                        case "user":
                            return new vscode.LanguageModelChatUserMessage(
                                typeof m.content === "string"
                                    ? m.content
                                    : m.content
                                          .map((mc) => {
                                              if (mc.type === "image_url")
                                                  throw new Error(
                                                      "images not supported with copilot models"
                                                  )
                                              else return mc.text
                                          })
                                          .join("\n"),
                                "genaiscript"
                            )
                        case "assistant":
                            return new vscode.LanguageModelChatAssistantMessage(
                                m.content,
                                m.name
                            )
                        case "function":
                        case "tool":
                            throw new Error(
                                "functions not supported with copilot models"
                            )
                        default:
                            throw new Error("uknown role")
                    }
                })
            const request = await vscode.lm.sendChatRequest(
                chatModel,
                messages,
                {
                    justification: `Run GenAIScript ${template.title || template.id}`,
                    modelOptions: { temperature, top_p, seed },
                },
                token
            )

            let text = ""
            for await (const fragment of request.stream) {
                text += fragment
                partialCb?.({
                    responseSoFar: text,
                    responseChunk: fragment,
                    tokensSoFar: estimateTokens(model, text),
                })
            }
            return { text }
        },
    })
}
