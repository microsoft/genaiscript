/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from "vscode"
import { AIRequestOptions, ExtensionState } from "./state"
import {
    RunTemplateOptions,
    estimateTokens,
    logVerbose,
} from "genaiscript-core"
import { isApiProposalEnabled } from "./proposals"
import { setupDotEnv } from "./dotenv"

export async function pickLanguageModel(state: ExtensionState) {
    const models = isLanguageModelsAvailable(state.context)
        ? vscode.lm.languageModels
        : []
    const dotenv = ".env"
    const cmodel = models?.length
        ? await vscode.window.showQuickPick<
              vscode.QuickPickItem & { model: string }
          >(
              [
                  {
                      label: "Configure .env file",
                      model: dotenv,
                  },
                  ...models.map((model) => ({
                      label: `Copilot: ${model}`,
                      model,
                  })),
              ],
              {
                  title: "Pick a Language Model",
              }
          )
        : { model: dotenv }

    const { model } = cmodel || {}
    if (model === dotenv) {
        await setupDotEnv(state.host.projectUri)
        return undefined
    } else {
        return model
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
    runOptions: RunTemplateOptions,
    chatModel: string
): void {
    logVerbose("using copilot llm")
    const { template } = options
    const { partialCb, infoCb } = runOptions

    // sanity check
    if (!vscode.lm.languageModels.includes(chatModel))
        throw new Error("Language model not found")

    runOptions.cache = false
    runOptions.getChatCompletions = async (req, chatOptions) => {
        const token = new vscode.CancellationTokenSource().token
        const { trace } = chatOptions
        const { model, temperature, top_p, seed, ...rest } = req

        trace.item(`script model: ${model}`)
        trace.item(`language model: ${chatModel}`)
        const messages: vscode.LanguageModelChatMessage[] = req.messages.map(
            (m) => {
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
                            m.content
                        )
                    case "function":
                    case "tool":
                        throw new Error(
                            "functions not supported with copilot models"
                        )
                    default:
                        throw new Error("uknown role")
                }
            }
        )
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
