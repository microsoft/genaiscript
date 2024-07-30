/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from "vscode"
import { AIRequestOptions, ExtensionState } from "./state"
import { isApiProposalEnabled } from "./proposals"
import { LanguageModel } from "../../core/src/chat"
import {
    MODEL_PROVIDER_OLLAMA,
    MODEL_PROVIDER_LLAMAFILE,
    MODEL_PROVIDER_AICI,
    MODEL_PROVIDER_AZURE,
    MODEL_PROVIDER_LITELLM,
    MODEL_PROVIDER_OPENAI,
    DOT_ENV_FILENAME,
    MODEL_PROVIDER_CLIENT,
} from "../../core/src/constants"
import { APIType } from "../../core/src/host"
import { parseModelIdentifier } from "../../core/src/models"
import { updateConnectionConfiguration } from "../../core/src/connection"
import { ChatCompletionMessageParam } from "../../core/src/chattypes"
import { LanguageModelChatRequest } from "../../core/src/server/client"
import { ChatStart } from "../../core/src/server/messages"

async function generateLanguageModelConfiguration(modelId: string) {
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

    let models: vscode.LanguageModelChat[] = []
    if (isLanguageModelsAvailable()) models = await vscode.lm.selectChatModels()
    const items: (vscode.QuickPickItem & {
        model?: string
        provider?: string
        apiType?: APIType
    })[] = models.map((model) => ({
        label: model.name,
        description: `${model.vendor} ${model.family}`,
        detail: `Visual Studio Language Model. ${model.version}, ${model.maxInputTokens}t.`,
        model: model.id,
        provider: MODEL_PROVIDER_CLIENT,
    }))
    if (items.length)
        items.unshift({
            kind: vscode.QuickPickItemKind.Separator,
            label: "Visual Studio Code Language Model",
        })
    items.push({
        kind: vscode.QuickPickItemKind.Separator,
        label: DOT_ENV_FILENAME,
    })
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
            title: `Pick a Language Model for ${modelId}`,
        })
    return res
}

async function pickChatModel(model: string): Promise<vscode.LanguageModelChat> {
    const chatModels = await vscode.lm.selectChatModels()
    const items: (vscode.QuickPickItem & {
        chatModel?: vscode.LanguageModelChat
    })[] = chatModels.map((chatModel) => ({
        label: chatModel.name,
        description: `${chatModel.vendor} ${chatModel.family}`,
        detail: `${chatModel.version}, ${chatModel.maxInputTokens}t.`,
        chatModel,
    }))
    const res = await vscode.window.showQuickPick(items, {
        title: `Pick a Chat Model for ${model}`,
    })
    return res?.chatModel
}

export async function pickLanguageModel(
    state: ExtensionState,
    modelId: string
) {
    const res = await generateLanguageModelConfiguration(modelId)
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

export const runChatModel: LanguageModelChatRequest = async (
    req: ChatStart,
    onChunk
) => {
    const token = new vscode.CancellationTokenSource().token
    const { model, messages, modelOptions } = req
    const chatModel = await pickChatModel(model)
    if (!chatModel) throw new Error("No chat model selected.")
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
        })
    }
    onChunk({
        finishReason: "done",
    })
}
