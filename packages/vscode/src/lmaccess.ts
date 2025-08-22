// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as vscode from "vscode";
import type { ExtensionState } from "./state";
import type { ChatCompletionMessageParam } from "../../core/src/chattypes";
import type { LanguageModelChatRequest } from "../../core/src/server/client";
import type { ChatStart } from "../../core/src/server/messages";
import { serializeError } from "../../core/src/error";
import { logVerbose } from "../../core/src/log";
import { renderMessageContent } from "../../core/src/chatrender";
import { parseModelIdentifier } from "../../core/src/models";
import { MODEL_GITHUB_COPILOT_CHAT_CURRENT, TOOL_NAME } from "../../core/src/constants";
import { dedent } from "../../core/src/indent";
import { genaiscriptDebug } from "../../core/src/debug";
import { showQuickPickWithTimeout } from "./uihelpers";
import { delay } from "es-toolkit";
const dbg = genaiscriptDebug("vscode:lm");

async function tryResolveChatModels() {
  dbg(`try to get models`);
  const chatModels = await vscode.lm.selectChatModels();
  if (chatModels?.length) return chatModels;

  // try again after a wait
  dbg(`wait 2s and try to get models again`);
  await delay(2000);
  return vscode.lm.selectChatModels();
}

async function pickChatModel(
  state: ExtensionState,
  modelId: string,
): Promise<vscode.LanguageModelChat> {
  const chatModels = await tryResolveChatModels();
  if (!chatModels?.length) {
    vscode.window.showErrorMessage(
      TOOL_NAME +
        " - No language chat models available.\nDid you signin with the GitHub Copilot Chat extension?",
    );
    return undefined;
  }

  const languageChatModels = await state.languageChatModels();
  const { model } = parseModelIdentifier(modelId);
  const currentChatModelId =
    modelId === MODEL_GITHUB_COPILOT_CHAT_CURRENT
      ? state.aiRequest?.options?.githubCopilotChatModelId
      : undefined;
  if (currentChatModelId) {
    const currentChatModel = chatModels.find((m) => m.id === currentChatModelId);
    if (currentChatModel) {
      dbg(`model mapping ${model} -> ${currentChatModel.id} (current)`);
      return currentChatModel;
    } else {
      vscode.window.showErrorMessage(
        TOOL_NAME +
          ` - language chat model ${currentChatModelId} not longer available. \nTry reloading the window.`,
      );
      return undefined;
    }
  }

  const mappedChatModelId = languageChatModels[model];
  if (mappedChatModelId) {
    const chatModel = chatModels.find((m) => m.id === mappedChatModelId);
    if (chatModel) {
      dbg(`model mapping ${model} -> ${chatModel.id} (mapped)`);
      return chatModel;
    } else {
      // we have a mapping but the model is not available anymore, so ignore mapping
      dbg(`model mapping ${model} -> ${mappedChatModelId} not longer available`);
      await state.updateLanguageChatModels(model, undefined);
    }
  }

  const chatModel = chatModels.find((m) => m.id === model);
  if (chatModel) {
    dbg(`model mapping ${model} -> ${chatModel.id} (exact match)`);
    return chatModel;
  }

  // apply heuristics to map models
  const heuristics = [/gpt-4.1-nano/, /gpt-4.1-mini/, /gpt-4.1/, /gpt-5-mini/];
  const candidate = heuristics.find((h) => h.test(model));
  if (candidate) {
    const candidateChatModel = chatModels.find((m) => candidate.test(m.id));
    if (candidateChatModel) {
      dbg(`model mapping ${model} -> ${candidateChatModel.id} (heuristic)`);
      return candidateChatModel;
    }
  }

  // check if user wants to be asked for model selection
  const config = state.getConfiguration();
  const askLanguageChatModel = config.get<boolean>("askLanguageChatModel", true);

  if (!askLanguageChatModel) {
    vscode.window.showErrorMessage(
      TOOL_NAME +
        ` - No language chat model matching ${modelId}. Model selection disabled via configuration.`,
    );
    return undefined;
  }

  // ask user
  const items: (vscode.QuickPickItem & {
    chatModel?: vscode.LanguageModelChat;
  })[] = chatModels.map((cm) => ({
    label: cm.name,
    description: `${cm.vendor} ${cm.family}`,
    detail: `${cm.version}, ${cm.maxInputTokens}t.`,
    chatModel: cm,
  }));
  dbg(`language models: %O`, items);
  if (items.length) {
    vscode.window.showInformationMessage(
      TOOL_NAME + " - Pick a Language Chat Model (see Command Palette)",
    );
    const res = await showQuickPickWithTimeout(items, {
      title: `Pick a Language Chat Model for ${model}`,
    });
    const chosenChatModel = res?.chatModel;
    if (chosenChatModel) await state.updateLanguageChatModels(model, chosenChatModel.id);
  }

  await vscode.window.showErrorMessage(
    TOOL_NAME +
      ` - No language chat model matching ${modelId} in ${chatModels.map((item) => item.id).join(", ")}`,
  );
  return undefined;
}

export function isLanguageModelsAvailable(): boolean {
  return typeof vscode.lm !== "undefined" && typeof vscode.lm.selectChatModels !== "undefined";
}

async function messagesToChatMessages(
  messages: ChatCompletionMessageParam[],
): Promise<vscode.LanguageModelChatMessage[]> {
  const res: vscode.LanguageModelChatMessage[] = [];
  for (const m of messages) {
    switch (m.role) {
      case "system":
      case "user":
      case "assistant":
        if (
          Array.isArray(m.content) &&
          m.content.some(
            (c: ChatCompletionMessageParam["content"][0]) =>
              typeof c === "object" && "type" in c && c.type === "image_url",
          )
        ) {
          throw new Error("Vision model not supported");
        }
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
  if (!isLanguageModelsAvailable()) {
    dbg("Language models are not available");
    return undefined;
  }

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

      for await (const fragment of request.text) {
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
        if (err instanceof Error && /Request Failed: 400/.test(err.message)) {
          // This model is not support in the the
          await vscode.window.showErrorMessage(
            dedent`${TOOL_NAME} - The model ${chatModel?.name || model} is not supported for chat participants (@genaiscript).
                        Please select a different model in GitHub Copilot Chat.`,
          );
        }
        onChunk({
          finishReason: "fail",
          error: serializeError(err),
        });
      }
    }
  };
}
