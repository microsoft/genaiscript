// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from "vscode";
import { ExtensionState } from "./state";
import type { ChatCompletionMessageParam } from "../../core/src/chattypes";
import type { LanguageModelChatRequest } from "../../core/src/server/client";
import type { ChatStart } from "../../core/src/server/messages";
import { serializeError } from "../../core/src/error";
import { logVerbose } from "../../core/src/util";
import { renderMessageContent } from "../../core/src/chatrender";
import { parseModelIdentifier } from "../../core/src/models";
import { MODEL_GITHUB_COPILOT_CHAT_CURRENT, TOOL_NAME } from "../../core/src/constants";
import { dedent } from "../../core/src/indent";

async function pickChatModel(
  state: ExtensionState,
  modelId: string,
): Promise<vscode.LanguageModelChat> {
  const chatModels = await vscode.lm.selectChatModels();
  const languageChatModels = await state.languageChatModels();
  const { model } = parseModelIdentifier(modelId);
  const chatModelId =
    (modelId === MODEL_GITHUB_COPILOT_CHAT_CURRENT
      ? state.aiRequest?.options?.githubCopilotChatModelId
      : undefined) || languageChatModels[model];
  let chatModel =
    chatModels.find((m) => m.id === model) ||
    (chatModelId && chatModels.find((m) => m.id === chatModelId));
  if (!chatModel) {
    const items: (vscode.QuickPickItem & {
      chatModel?: vscode.LanguageModelChat;
    })[] = chatModels.map((chatModel) => ({
      label: chatModel.name,
      description: `${chatModel.vendor} ${chatModel.family}`,
      detail: `${chatModel.version}, ${chatModel.maxInputTokens}t.`,
      chatModel,
    }));
    if (items?.length) {
      const res = await vscode.window.showQuickPick(items, {
        title: `Pick a Language Chat Model for ${model}`,
      });
      chatModel = res?.chatModel;
      if (chatModel) await state.updateLanguageChatModels(model, chatModel.id);
    } else {
      await vscode.window.showErrorMessage(
        TOOL_NAME + ` - No language chat model available, could not resolve ${modelId}`,
      );
    }
  }
  return chatModel;
}

export function isLanguageModelsAvailable() {
  return typeof vscode.lm !== "undefined" && typeof vscode.lm.selectChatModels !== "undefined";
}

async function messagesToChatMessages(messages: ChatCompletionMessageParam[]) {
  const res: vscode.LanguageModelChatMessage[] = [];
  for (const m of messages) {
    switch (m.role) {
      case "system":
      case "user":
      case "assistant":
        if (
          Array.isArray(m.content) &&
          m.content.some((c: any) => typeof c === "object" && "type" in c && c.type === "image_url")
        )
          throw new Error("Vision model not supported");
        res.push(
          vscode.LanguageModelChatMessage.User(
            await renderMessageContent(m, { textLang: "raw" }),
            "genaiscript",
          ),
        );
        break;
      default:
        throw new Error(`${m.role} not supported with GitHub Copilot Chat models`);
    }
  }
  return res;
}

export function createChatModelRunner(state: ExtensionState): LanguageModelChatRequest {
  if (!isLanguageModelsAvailable()) return undefined;

  return async (req: ChatStart, onChunk) => {
    const { model, messages, modelOptions } = req;
    let chatModel: vscode.LanguageModelChat;
    try {
      const token = new vscode.CancellationTokenSource().token;
      chatModel = await pickChatModel(state, model);
      if (!chatModel) {
        logVerbose("no language chat model selected, cancelling");
        onChunk({
          finishReason: "fail",
          error: serializeError(new Error("No language chat model selected")),
        });
        return;
      }
      const chatMessages = await messagesToChatMessages(messages);
      const request = await chatModel.sendRequest(
        chatMessages,
        {
          justification: `Run GenAIScript`,
          modelOptions,
        },
        token,
      );

      let text = "";
      for await (const fragment of request.text) {
        text += fragment;
        onChunk({
          chunk: fragment,
          tokens: await chatModel.countTokens(fragment),
          finishReason: undefined,
          model: chatModel.id,
        });
      }
      onChunk({
        finishReason: "stop",
      });
    } catch (err) {
      if (err instanceof vscode.LanguageModelError) {
        const offTopic = err.code === vscode.LanguageModelError.Blocked.name;
        onChunk({
          finishReason: offTopic ? "content_filter" : "fail",
          error: serializeError(err),
        });
      } else {
        if (err instanceof Error && /Request Failed: 400/.test(err.message))
          // This model is not support in the the
          await vscode.window.showErrorMessage(
            dedent`${TOOL_NAME} - The model ${chatModel?.name || model} is not supported for chat participants (@genaiscript).
                        Please select a different model in GitHub Copilot Chat.`,
          );
        onChunk({
          finishReason: "fail",
          error: serializeError(err),
        });
      }
    }
  };
}
