/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from "vscode"
import { AIRequestOptions, ExtensionState } from "./state"
import {
    RunTemplateOptions,
    estimateTokens,
    logVerbose,
} from "genaiscript-core"
import { isApiProposalEnabled } from "./proposals"

export async function pickLanguageModel() {
    const models = vscode.lm.languageModels
    const cmodel = await vscode.window.showQuickPick<
        vscode.QuickPickItem & { model: string }
    >(
        [
            {
                label: "Configure .env file",
                model: ".env",
            },
            ...models.map((model) => ({
                label: model,
                model,
            })),
        ],
        {
            title: "Pick a Language Model",
        }
    )
    return cmodel?.model
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
    runOptions: RunTemplateOptions,
    chatModel: string
): void {
    logVerbose("using copilot llm")
    const { template } = options
    const { partialCb, infoCb } = runOptions

    if (!vscode.lm.languageModels.includes(chatModel))
        throw new Error("Language model not found")

    runOptions.cache = false
    runOptions.getChatCompletions = async (req, chatOptions) => {
        const { token = new vscode.CancellationTokenSource().token } =
            options.chat || {}
        const { trace } = chatOptions
        const { model, temperature, top_p, seed, ...rest } = req

        trace.item(`script model: ${model}`)
        trace.item(`language model: ${chatModel}`)
        const messages = req.messages.map((m) => ({
            role: m.role,
            content: typeof m.content === "string" ? m.content : "...",
        }))
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
    }
}
