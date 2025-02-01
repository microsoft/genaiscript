/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from "vscode"
import { ExtensionState } from "./state"
import { ChatCompletionMessageParam } from "../../core/src/chattypes"
import { LanguageModelChatRequest } from "../../core/src/server/client"
import { ChatStart } from "../../core/src/server/messages"
import { serializeError } from "../../core/src/error"
import { logVerbose } from "../../core/src/util"
import { renderMessageContent } from "../../core/src/chatrender"
import { parseModelIdentifier } from "../../core/src/models"

async function pickChatModel(
    state: ExtensionState,
    modelId: string
): Promise<vscode.LanguageModelChat> {
    const chatModels = await vscode.lm.selectChatModels()
    const languageChatModels = await state.languageChatModels()
    const { model } = parseModelIdentifier(modelId)
    const chatModelId = languageChatModels[model]
    let chatModel =
        chatModels.find((m) => m.id === model) ||
        (chatModelId && chatModels.find((m) => m.id === chatModelId))
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
