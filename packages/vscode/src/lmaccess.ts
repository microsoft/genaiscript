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
    TOOL_NAME,
    MODEL_PROVIDER_AZURE_SERVERLESS,
} from "../../core/src/constants"
import { APIType } from "../../core/src/host"
import { parseModelIdentifier } from "../../core/src/models"
import { ChatCompletionMessageParam } from "../../core/src/chattypes"
import { LanguageModelChatRequest } from "../../core/src/server/client"
import { ChatStart } from "../../core/src/server/messages"
import { serializeError } from "../../core/src/error"
import { logVerbose } from "../../core/src/util"
import { renderMessageContent } from "../../core/src/chatrender"

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
        provider === MODEL_PROVIDER_AZURE_SERVERLESS ||
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
            label: "Azure AI Models (serverless deployment)",
            detail: `Use a Azure serverless model deployment.`,
            provider: MODEL_PROVIDER_AZURE_SERVERLESS,
            apiType: "azure_serverless",
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
        const configure = "Configure..."
        vscode.window
            .showWarningMessage(
                `${TOOL_NAME} - model connection not configured.`,
                configure
            )
            .then((res) => {
                if (res === configure)
                    vscode.commands.executeCommand(
                        "genaiscript.connection.configure"
                    )
            })
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
            case "user":
            case "assistant":
                if (
                    Array.isArray(m.content) &&
                    m.content.some((c) => c.type === "image_url")
                )
                    throw new Error("Vision model not supported")
                return vscode.LanguageModelChatMessage.User(
                    renderMessageContent(m),
                    "genaiscript"
                )
            case "function":
            case "tool":
                throw new Error("tools not supported with copilot models")
            default:
                throw new Error("unknown role " + m.role)
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
                logVerbose("no language chat model selected, cancelling")
                onChunk({
                    finishReason: "fail",
                    error: serializeError(
                        new Error("No language chat model selected")
                    ),
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
                    tokens: await chatModel.countTokens(fragment),
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
