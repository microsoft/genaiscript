// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as vscode from "vscode";
import { ExtensionState } from "./state.js";
import { registerCommand } from "./commands.js";
import {
  GENAI_ANY_REGEX,
  PromptParameters,
  PromptScript,
  TOOL_ID,
  TOOL_NAME,
} from "@genaiscript/core";
import { logInfo, logVerbose } from "@genaiscript/core";
import { resolveCli } from "./config.js";
import { YAMLStringify } from "@genaiscript/core";
import { dotGenaiscriptPath } from "@genaiscript/core";
import { TemplateQuickPickItem, showPromptParametersQuickPicks } from "./parameterquickpick.js";
import { scriptsToQuickPickItems } from "./scriptquickpick.js";
import { getSelectedText } from "./selection.js";

export function activateFragmentCommands(state: ExtensionState) {
  const { context, host } = state;
  const { subscriptions } = context;

  const findScript = (filename: vscode.Uri) => {
    const f = state.host.path.resolve(filename.fsPath);
    logVerbose(`find ${f} in ${state.host.projectUri.fsPath}`);
    const scripts = state.project.scripts.filter((p) => !!p.filename);
    const script = scripts.find((p) => {
      const sfp = state.host.path.resolve(host.toUri(p.filename).fsPath);
      logVerbose(`${p.filename} => ${sfp} => ${sfp === f}`);
      return sfp === f;
    });
    return script;
  };

  const pickTemplate = async (options?: { filter?: (p: PromptScript) => boolean }) => {
    const { filter = () => true } = options || {};
    const templates = state.project.scripts
      .filter((t) => !t.isSystem && t.group !== "infrastructure" && !t.unlisted)
      .filter(filter);

    const picked = await vscode.window.showQuickPick(
      scriptsToQuickPickItems(templates, { create: true }),
      {
        title: `Pick a GenAIScript`,
      },
    );
    if (picked?.action === "create") {
      vscode.commands.executeCommand("genaiscript.prompt.create");
      return undefined;
    } else return (picked as TemplateQuickPickItem)?.template;
  };

  const scriptRun = async (
    fileOrFolder: vscode.Uri | undefined,
    extraArgs: vscode.Uri[] | { groupId: unknown } | undefined,
  ) => {
    // grab this early before any UI interactions
    const selectedText = getSelectedText();

    // fileOrFolder is undefined from the command palette
    const fileOrFolders = Array.isArray(extraArgs) ? (extraArgs as vscode.Uri[]) : undefined;
    // editor context menu
    // explorer context menu (file or folder) - uri to file or folder
    // edit file run button: uri to genai file in editor
    logVerbose(`run ${fileOrFolder}, ${fileOrFolders?.length || 0} files`);
    await state.cancelAiRequest();
    await state.parseWorkspace();

    let scriptId: string;
    let files: string[];
    let parameters: PromptParameters;

    const defaultValues = { selectedText };
    if (GENAI_ANY_REGEX.test(fileOrFolder?.path)) {
      const script = findScript(fileOrFolder);
      parameters = await showPromptParametersQuickPicks(script, defaultValues);
      if (parameters === undefined) return;
      scriptId = script?.id || fileOrFolder.toString();
      files = [];
    } else {
      const script = await pickTemplate();
      if (!script) return;
      parameters = await showPromptParametersQuickPicks(script, defaultValues);
      if (parameters === undefined) return;
      scriptId = script.id;
      files = fileOrFolders?.map((f) => f.fsPath) || [fileOrFolder?.fsPath];
    }
    await state.requestAI({
      fragment: { files: files.filter((f) => !!f) },
      scriptId,
      label: scriptId,
      parameters,
    });
  };

  const scriptDebug = async (file: vscode.Uri) => {
    if (!file) return;

    // grab this early before any UI interactions
    const selectedText = getSelectedText();

    await state.cancelAiRequest();
    await state.parseWorkspace();

    let script: PromptScript;
    let files: vscode.Uri[];
    if (GENAI_ANY_REGEX.test(file.path)) {
      script = findScript(file);
      if (!script) {
        return;
      }
      files = [];
    } else {
      script = await pickTemplate();
      if (!script) return;
      files = [file];
    }
    const defaultValues = { selectedText };
    const parameters = await showPromptParametersQuickPicks(script, defaultValues);
    if (parameters === undefined) return;

    const { cliPath, cliVersion } = await resolveCli(state);
    const args = [
      "run",
      vscode.workspace.asRelativePath(script.filename),
      ...files.map((file) => vscode.workspace.asRelativePath(file.fsPath)),
    ];
    for (const [name, value] of Object.entries(parameters)) {
      args.push(`--vars`, `${name}=${value}`);
    }

    const configuration = cliPath
      ? ((<vscode.DebugConfiguration>{
          type: "node",
          name: TOOL_NAME,
          request: "launch",
          console: "integratedTerminal",
          internalConsoleOptions: "neverOpen",
          skipFiles: ["<node_internals>/**", dotGenaiscriptPath("**")],

          args: [cliPath, ...args],
        }) satisfies vscode.DebugConfiguration)
      : <vscode.DebugConfiguration>{
          type: "node",
          name: TOOL_NAME,
          request: "launch",
          console: "integratedTerminal",
          internalConsoleOptions: "neverOpen",
          skipFiles: ["<node_internals>/**", dotGenaiscriptPath("**")],

          runtimeExecutable: "npx",
          runtimeArgs: [`--yes`, `${TOOL_ID}@${cliVersion}`, ...args],
        };

    logInfo(`start debugging ${YAMLStringify(configuration)}`);
    await vscode.debug.startDebugging(vscode.workspace.workspaceFolders[0], configuration);
  };

  subscriptions.push(
    registerCommand("genaiscript.fragment.prompt", scriptRun),
    registerCommand("genaiscript.fragment.debug", scriptDebug),
  );
}
