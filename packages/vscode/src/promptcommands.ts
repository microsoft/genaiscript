// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as vscode from "vscode";
import { ExtensionState } from "./state";
import { scriptsToQuickPickItems } from "./scriptquickpick";
import { registerCommand } from "./commands";
import type { PromptScript } from "../../core/src/types";
import { createScript } from "../../core/src/scripts";
import { copyPrompt } from "../../core/src/copy";

export function activatePromptCommands(state: ExtensionState) {
  const { context, host } = state;
  const { subscriptions } = context;

  async function showPrompt(fn: string) {
    vscode.window.showTextDocument(host.toUri(fn));
  }

  subscriptions.push(
    registerCommand("genaiscript.newfile.script", () =>
      vscode.commands.executeCommand("genaiscript.prompt.create"),
    ),
    registerCommand("genaiscript.prompt.refresh", async () => {
      await state.parseWorkspace();
    }),
    registerCommand("genaiscript.prompt.create", async (template?: PromptScript) => {
      const name = await vscode.window.showInputBox({
        title: "Pick a file name for the new GenAIScript.",
      });
      if (name === undefined) return;
      const t = createScript(name, { template });
      const pr = await copyPrompt(t, { fork: false, name });
      await state.parseWorkspace();
      await showPrompt(pr);
    }),
    registerCommand("genaiscript.prompt.fork", async (template: PromptScript | string) => {
      if (!template) {
        if (!state.project) await state.parseWorkspace();
        const templates = state.project?.scripts;
        if (!templates?.length) return;
        const picked = await vscode.window.showQuickPick(scriptsToQuickPickItems(templates), {
          title: `Pick a GenAIScript to fork`,
        });
        if (picked === undefined) return;
        template = picked.template;
      } else if (typeof template === "string") {
        if (!state.project) await state.parseWorkspace();
        template = state.project?.scripts.find((t) => t.id === template);
      }
      const newPrompt = await copyPrompt(template as PromptScript, {
        fork: true,
        name: (template as PromptScript).id,
      });
      await state.parseWorkspace();
      await showPrompt(newPrompt);
    }),
    registerCommand("genaiscript.prompt.navigate", async (prompt: PromptScript) => {
      const uri = host.toUri(prompt.filename);
      await vscode.window.showTextDocument(uri);
    }),
  );
}

export function commandButtons(state: ExtensionState) {
  const request = state.aiRequest;
  const { computing } = request || {};
  const abort = "Abort";
  const view = "View";
  const output = "Output";
  const trace = "Trace";
  const show = "Show";
  const start = "Start";
  const stop = "Stop";
  const cmds: { label: string; description?: string; cmd: string }[] = [];
  if (computing) cmds.push({ label: abort, cmd: "genaiscript.request.abort" });
  cmds.push({
    label: view,
    description: "View GenAIScript request.",
    cmd: "genaiscript.request.open.view",
  });
  cmds.push({
    label: output,
    description: "Preview AI response.",
    cmd: "genaiscript.request.open.output",
  });
  cmds.push({
    label: trace,
    description: "Inspect script execution and LLM response.",
    cmd: "genaiscript.request.open.trace",
  });
  if (state.host.server.status !== "stopped") {
    cmds.push({
      label: show,
      description: "Show GenAIScript server terminal",
      cmd: "genaiscript.server.show",
    });
    cmds.push({
      label: stop,
      description: "Stop GenAIScript server",
      cmd: "genaiscript.server.stop",
    });
  } else {
    cmds.push({
      label: start,
      description: "Start GenAIScript server",
      cmd: "genaiscript.server.start",
    });
  }

  return cmds;
}

export function commandButtonsMarkdown(state: ExtensionState, sep = " | ") {
  const res = commandButtons(state)
    .map(({ label, cmd }) => `[${label}](command:${cmd})`)
    .join(sep);
  return res;
}
