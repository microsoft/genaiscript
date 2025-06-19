// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as vscode from "vscode";
import { ExtensionContext } from "vscode";

export function isApiProposalEnabled(
  context: ExtensionContext,
  proposal: string,
  extensionId?: string,
) {
  // declared in package.json?
  const packageJSON: { enabledApiProposals?: string } = context.extension.packageJSON;
  if (
    !vscode.env.appName.includes("Insiders") ||
    !packageJSON.enabledApiProposals?.includes(proposal)
  )
    return false;

  // test if extension is loaded
  if (extensionId && !vscode.extensions.getExtension(extensionId)) return false;

  return true;
}
