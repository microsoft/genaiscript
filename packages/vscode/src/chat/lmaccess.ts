/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from "vscode"
import { AIRequestOptions } from "../state"
import {
    RunTemplateOptions,
    estimateTokens,
    logVerbose,
} from "genaiscript-core"
import { isApiProposalEnabled } from "../proposals"

async function getLanguageModel(model: string, template: PromptTemplate) {
    const models = vscode.lm.languageModels
    const tmodel = model || "gpt-4"
    let cmodel = models.find((m) => m === "copilot-" + tmodel)
    if (!cmodel) {
        cmodel = await vscode.window.showQuickPick(models, {
            title: "Pick a Language Model",
        })
        if (cmodel === undefined) return undefined
    }
    return cmodel
}

export function configureLanguageModelAccess(
    context: vscode.ExtensionContext,
    options: AIRequestOptions,
    runOptions: RunTemplateOptions
): void {
    logVerbose("using copilot llm")
    const { template } = options
    const { partialCb, infoCb } = runOptions

    // test if extension is loaded
    if (!isApiProposalEnabled(context, "languageModels", "github.copilot-chat"))
        return

    runOptions.cache = false
    runOptions.getChatCompletions = async (req, chatOptions) => {
        const { token = new vscode.CancellationTokenSource().token } =
            options.chat || {}
        const { trace } = chatOptions
        const { model, temperature, top_p, seed, ...rest } = req

        trace.item(`script model: ${model}`)
        const chatModel = await getLanguageModel(model, template)
        if (chatModel === undefined) {
            return { text: "" }
        }
        trace.item(`copilot llm model: ${chatModel}`)
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
