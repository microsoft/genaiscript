// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as vscode from "vscode";
import { TOOL_NAME } from "../../core/src/constants";
import { errorMessage } from "../../core/src/error";

export function registerCommand(id: string, command: (...args: unknown[]) => Thenable<void>) {
  return vscode.commands.registerCommand(id, async function (...args: unknown[]) {
    try {
      await command(...args);
    } catch (e) {
      console.debug(e);
      vscode.window.showErrorMessage(TOOL_NAME + " - " + errorMessage(e));
    }
  });
}
