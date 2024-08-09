/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from "vscode"
import { ExtensionState } from "./state"
import {
    MODEL_PROVIDER_OLLAMA,
    MODEL_PROVIDER_LLAMAFILE,
    MODEL_PROVIDER_AICI,
    MODEL_PROVIDER_AZURE,
    MODEL_PROVIDER_LITELLM,
    MODEL_PROVIDER_OPENAI,
    MODEL_PROVIDER_CLIENT,
    MODEL_PROVIDER_GITHUB,
} from "../../core/src/constants"
import { APIType } from "../../core/src/host"
import { parseModelIdentifier } from "../../core/src/models"
import { updateConnectionConfiguration } from "../../core/src/connection"
import { ChatCompletionMessageParam } from "../../core/src/chattypes"
import { LanguageModelChatRequest } from "../../core/src/server/client"
import { ChatStart } from "../../core/src/server/messages"
import { serializeError } from "../../core/src/error"

async function generateLanguageModelConfiguration(
    state: ExtensionState,
    modelId: string
) {
    const { provider } = parseModelIdentifier(modelId)
    if (
        provider === MODEL_PROVIDER_OLLAMA ||
        provider === MODEL_PROVIDER_LLAMAFILE ||
        provider === MODEL_PROVIDER_AICI ||
        provider === MODEL_PROVIDER_AZURE ||
        provider === MODEL_PROVIDER_LITELLM
    ) {
        return { provider }
    }

    const languageChatModels = await state.languageChatModels()
    if (Object.keys(languageChatModels).length)
        return { provider: MODEL_PROVIDER_CLIENT, model: "*" }

    const items: (vscode.QuickPickItem & {
        model?: string
        provider?: string
        apiType?: APIType
    })[] = []
    if (isLanguageModelsAvailable()) {
        const models = await vscode.lm.selectChatModels()
        if (models.length)
            items.push({
                label: "Visual Studio Language Chat Models",
                detail: `Use a registered LLM such as GitHub Copilot.`,
                model: "*",
                provider: MODEL_PROVIDER_CLIENT,
            })
    }
    items.push(
        {
            label: "OpenAI",
            detail: `Use a personal OpenAI subscription.`,
            provider: MODEL_PROVIDER_OPENAI,
        },
        {
            label: "Azure OpenAI",
            detail: `Use a Azure-hosted OpenAI subscription.`,
            provider: MODEL_PROVIDER_AZURE,
            apiType: "azure",
        },
        {
            label: "GitHub Models",
            detail: `Use a GitHub Models with a GitHub subscription.`,
            provider: MODEL_PROVIDER_GITHUB,
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

    const res: { model?: string; provider?: string; apiType?: APIType } =
        await vscode.window.showQuickPick<
            vscode.QuickPickItem & {
                model?: string
                provider?: string
                apiType?: APIType
            }
        >(items, {
            title: `Configure a Language Model for ${modelId}`,
        })

    return res
}

async function pickChatModel(
    state: ExtensionState,
    model: string
): Promise<vscode.LanguageModelChat> {
    const chatModels = await vscode.lm.selectChatModels()
    const languageChatModels = await state.languageChatModels()
    const chatModelId = languageChatModels[model]
    let chatModel = chatModelId && chatModels.find((m) => m.id === chatModelId)
    if (!chatModel) {
        const items: (vscode.QuickPickItem & {
            chatModel?: vscode.LanguageModelChat
        })[] = chatModels.map((chatModel) => ({
            label: chatModel.name,
            description: `${chatModel.vendor} ${chatModel.family}`,
            detail: `${chatModel.version}, ${chatModel.maxInputTokens}t.`,
            chatModel,
        }))
        if (items?.length) {
            const res = await vscode.window.showQuickPick(items, {
                title: `Pick a Language Chat Model for ${model}`,
            })
            chatModel = res?.chatModel
            if (chatModel)
                await state.updateLanguageChatModels(model, chatModel.id)
        }
    }
    return chatModel
}

export async function pickLanguageModel(
    state: ExtensionState,
    modelId: string
) {
    const res = await generateLanguageModelConfiguration(state, modelId)
    if (res === undefined) return undefined

    if (res.model) return res.model
    else {
        await updateConnectionConfiguration(res.provider, res.apiType)
        const doc = await vscode.workspace.openTextDocument(
            state.host.toUri("./.env")
        )
        await vscode.window.showTextDocument(doc)
        return undefined
    }
}

export function isLanguageModelsAvailable() {
    return (
        typeof vscode.lm !== "undefined" &&
        typeof vscode.lm.selectChatModels !== "undefined"
    )
}

function messagesToChatMessages(messages: ChatCompletionMessageParam[]) {
    const res: vscode.LanguageModelChatMessage[] = messages.map((m) => {
        switch (m.role) {
            case "system":
                return <vscode.LanguageModelChatMessage>{
                    role: vscode.LanguageModelChatMessageRole.User,
                    content: m.content,
                }
            case "user":
                if (
                    Array.isArray(m.content) &&
                    m.content.some((c) => c.type === "image_url")
                )
                    throw new Error("Vision model not supported")
                return <vscode.LanguageModelChatMessage>{
                    role: vscode.LanguageModelChatMessageRole.User,
                    content:
                        typeof m.content === "string"
                            ? m.content
                            : m.content.map((c) => c).join("\n"),
                }
            case "assistant":
                return <vscode.LanguageModelChatMessage>{
                    role: vscode.LanguageModelChatMessageRole.Assistant,
                    content: m.content,
                }
            case "function":
            case "tool":
                throw new Error("tools not supported with copilot models")
            default:
                throw new Error("uknown role")
        }
    })
    return res
}

export function createChatModelRunner(
    state: ExtensionState
): LanguageModelChatRequest {
    if (!isLanguageModelsAvailable()) return undefined

    return async (req: ChatStart, onChunk) => {
        try {
            const token = new vscode.CancellationTokenSource().token
            const { model, messages, modelOptions } = req
            const chatModel = await pickChatModel(state, model)
            if (!chatModel) {
                onChunk({
                    finishReason: "cancel",
                })
                return
            }
            const chatMessages = messagesToChatMessages(messages)
            const request = await chatModel.sendRequest(
                chatMessages,
                {
                    justification: `Run GenAIScript`,
                    modelOptions,
                },
                token
            )

            let text = ""
            for await (const fragment of request.text) {
                text += fragment
                onChunk({
                    chunk: fragment,
                    tokens: await chatModel.countTokens(text),
                    finishReason: undefined,
                    model: chatModel.id,
                })
            }
            onChunk({
                finishReason: "stop",
            })
        } catch (err) {
            if (err instanceof vscode.LanguageModelError) {
                const offTopic =
                    err.code === vscode.LanguageModelError.Blocked.name
                onChunk({
                    finishReason: offTopic ? "content_filter" : "fail",
                    error: serializeError(err),
                })
            } else {
                onChunk({
                    finishReason: "fail",
                    error: serializeError(err),
                })
            }
        }
    }
}
