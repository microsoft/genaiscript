// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

// cspell: disable
import * as vscode from "vscode";
import type { ExtensionState } from "./state";
import {
  COPILOT_CHAT_PARTICIPANT_SCRIPT_ID,
  COPILOT_CHAT_PARTICIPANT_ID,
  ICON_LOGO_NAME,
  MODEL_PROVIDER_GITHUB_COPILOT_CHAT,
} from "../../core/src/constants";
import type { PromptScript } from "../../core/src/types";
import type { HistoryMessageUser, HistoryMessageAssistant } from "../../core/src/types";
import type { Fragment } from "../../core/src/generation";
import { convertAnnotationsToItems } from "../../core/src/annotations";
import { patchCachedImages } from "../../core/src/filecache";
import { deleteUndefinedValues } from "../../core/src/cleaners";

export async function activateChatParticipant(state: ExtensionState) {
  const { context } = state;
  const { subscriptions } = context;

  const resolveReference = (
    references: readonly vscode.ChatPromptReference[],
  ): { files: string[]; vars: Record<string, string> } => {
    const files = [];
    const vars: Record<string, string> = {};
    for (const reference of references) {
      const { id, value } = reference;
      if (typeof value === "string") vars[id] = value;
      else if (value instanceof vscode.Uri) {
        files.push(vscode.workspace.asRelativePath(value, false));
      } else if (value instanceof vscode.Location) {
        files.push(vscode.workspace.asRelativePath(value.uri, false));
      } // TODO range
      else state.output.appendLine(`unknown reference type: ${typeof value}`);
    }
    return { files, vars };
  };

  const participant = vscode.chat.createChatParticipant(
    COPILOT_CHAT_PARTICIPANT_ID,
    async (
      request: vscode.ChatRequest,
      context: vscode.ChatContext,
      response: vscode.ChatResponseStream,
      token: vscode.CancellationToken,
    ) => {
      const { command, references, model } = request;
      let { prompt } = request;

      const md = (t: string, ...enabledCommands: string[]) => {
        const ms = new vscode.MarkdownString(t + "\n", true);
        if (enabledCommands.length) {
          ms.isTrusted = {
            enabledCommands,
          };
        }
        response.markdown(ms);
      };

      // this command does not require any parsing
      if (command === "models") {
        const chatModels = await vscode.lm.selectChatModels();
        const languageChatModels = await state.languageChatModels();
        md(`This is the current model alias mapping:\n`);
        for (const chatModel of chatModels) {
          md(
            `- \`${languageChatModels[chatModel.id] || "---"}\` > \`${chatModel.id}\`, ${chatModel.name}, max ${chatModel.maxInputTokens}t\n`,
          );
        }
        return;
      }

      // parse and analyze results
      await state.parseWorkspace();
      if (token.isCancellationRequested) return;

      const { project } = state;
      const templates = project.scripts
        .filter((s) => !s.isSystem && !s.unlisted)
        .sort((a, b) => a.id.localeCompare(b.id));

      const mdHelp = () =>
        md(
          `\n\n[Docs](https://microsoft.github.io/genaiscript/reference/vscode/github-copilot-chat/) | [Samples](https://microsoft.github.io/genaiscript/samples/)\n`,
        );
      const mdEmpty = () =>
        md(
          `\n😞 Oops, I could not find any genaiscript. [Create a new script](command:genaiscript.prompt.create)?\n`,
          "genaiscript.prompt.create",
        );
      const mdTemplateList = () => {
        templates.forEach((s) => {
          response.markdown(`- \`${s.id}\`: `);
          if (s.filename) response.anchor(vscode.Uri.file(s.filename), s.id);
          response.markdown(` ${s.title}\n`);
        });
      };

      // list command
      if (command === "list") {
        if (templates.length) {
          md("Use `@genaiscript /run <scriptid> ...` with:\n");
          mdTemplateList();
        } else {
          mdEmpty();
        }
        mdHelp();
        return;
      }

      // try resolving template or handling run
      let scriptid = "";
      let template: PromptScript;
      if (command === "run") {
        scriptid = prompt.split(" ")[0];
        prompt = prompt.slice(scriptid.length).trim();
        template = templates.find((t) => t.id === scriptid);
      } else {
        template = templates.find((t) => t.id === COPILOT_CHAT_PARTICIPANT_SCRIPT_ID);
      }

      // tell user which templates are available
      if (!template) {
        if (scriptid === "") md(`😓 Please specify a genaiscript to run.\n`);
        else md(`😕 Oops, I could not find any genaiscript matching \`${scriptid}\`.\n`);
        if (templates.length === 0) {
          mdEmpty();
        } else {
          md(`Try one of the following:\n`);
          mdTemplateList();
        }
        mdHelp();
        return;
      }

      const { files, vars } = resolveReference(references);
      const history = renderHistory(context);
      const fragment: Fragment = {
        files,
      };

      const canceller = token.onCancellationRequested(async () => await state.cancelAiRequest());
      const res = await state.requestAI({
        scriptId: template.id,
        label: "genaiscript agent",
        parameters: deleteUndefinedValues({
          ...vars,
          "copilot.history": history,
          "copilot.model": `${MODEL_PROVIDER_GITHUB_COPILOT_CHAT}:${model.id}`,
          question: prompt,
        }),
        githubCopilotChatModelId: model.id,
        fragment,
        mode: "chat",
      });
      canceller.dispose();
      if (token.isCancellationRequested) return;

      const { text = "", status, statusText, runId } = res || {};
      if (status !== "success") md("$(error) " + statusText);
      if (text) {
        let patched = convertAnnotationsToItems(text);
        const dir = state.host.projectUri;
        patched = patchCachedImages(patched, (url) => {
          const wurl = vscode.Uri.joinPath(dir, url).toString();
          state.output.appendLine(`image: ${url}`);
          state.output.appendLine(`       ${wurl}`);
          return wurl;
        });
        md("\n\n" + patched);
      }
      // TODO open url
      if (runId) {
        const server = state.host.server;
        md(`\n\n[Trace](${server.browserUrl}#scriptid=${template.id}&runid=${res.runId})`);
      }
    },
  );
  participant.iconPath = new vscode.ThemeIcon(ICON_LOGO_NAME);

  subscriptions.push(participant);
}

function renderHistory(
  context: vscode.ChatContext,
): (HistoryMessageUser | HistoryMessageAssistant)[] {
  const { history } = context;
  if (!history?.length) return undefined;
  const res = history
    .map((message) => {
      if (message instanceof vscode.ChatRequestTurn) {
        return {
          role: "user",
          content: message.prompt,
        } satisfies HistoryMessageUser;
      } else if (message instanceof vscode.ChatResponseTurn) {
        return {
          role: "assistant",
          name: message.participant,
          content: message.response
            .map((r) => {
              if (r instanceof vscode.ChatResponseMarkdownPart) {
                return r.value.value;
              } else if (r instanceof vscode.ChatResponseAnchorPart) {
                if (r.value instanceof vscode.Uri) {
                  return vscode.workspace.asRelativePath(r.value.fsPath);
                } else return vscode.workspace.asRelativePath(r.value.uri.fsPath);
              }
              return "";
            })
            .join(""),
        } as HistoryMessageAssistant;
      } else return undefined;
    })
    .filter((f) => !!f);
  return res.length ? res : undefined;
}
