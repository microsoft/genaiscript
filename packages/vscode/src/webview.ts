// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as vscode from "vscode";
import { TOOL_ID, TOOL_NAME } from "@genaiscript/core";
import { ExtensionState } from "./state.js";
import { registerCommand } from "./commands.js";
import { Utils } from "vscode-uri";
import { assert } from "@genaiscript/core";
import { randomHex } from "@genaiscript/core";

export async function createWebview(state: ExtensionState): Promise<vscode.WebviewPanel> {
  const { host, sessionApiKey, context } = state;
  const { url, externalUrl, cspUrl } = await host.server.client();

  const panel = vscode.window.createWebviewPanel(TOOL_ID, TOOL_NAME, vscode.ViewColumn.One, {
    localResourceRoots: [],
    enableScripts: true,
    retainContextWhenHidden: true,
  });
  context.subscriptions.push(panel);
  const cspSource = panel.webview.cspSource;
  const nonce = randomHex(32);

  let html: string;
  const web = vscode.env.uiKind === vscode.UIKind.Web;
  if (web) {
    assert(!state.sessionApiKey);
    html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GenAIScript View Holder</title>
    <meta http-equiv="Content-Security-Policy" content="
        default-src 'none'; 
        frame-src ${cspUrl} ${cspSource} https://*.github.dev/ https://github.dev/;
        style-src ${cspUrl} ${cspSource} https://*.github.dev/ https://github.dev/ 'nonce-${nonce}';
    " />
    <style nonce="${nonce}">
        body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
        iframe { width: 100%; height: 100%; border: none; }
    </style>
</head>
<body><iframe sandbox="allow-scripts allow-same-origin allow-forms" src="${externalUrl}?view=results"></iframe></body>
</html>`;
  } else {
    const { authority } = host.server;
    const authorityUri = await vscode.env.asExternalUri(vscode.Uri.parse(authority));
    const faviconUri = Utils.joinPath(authorityUri, "favicon.svg");
    const stylesheetUri = Utils.joinPath(authorityUri, "built/markdown.css");
    const codeIconsUri = Utils.joinPath(authorityUri, "built/codicon.css");
    const scriptUri = Utils.joinPath(authorityUri, "built/web.mjs");
    const wsCspUrl = vscode.Uri.parse(cspUrl).with({ scheme: "ws" }).toString();
    // lock down CSP
    const csp = `
            default-src 'none'; 
            frame-src ${cspUrl} ${cspSource} https:; 
            img-src ${cspUrl} ${cspSource} https: data:;
            media-src ${cspUrl} ${cspSource} https: data:;
            connect-src ${cspUrl} ${wsCspUrl} https://*.github.dev/ wss://*.github.dev/ https://github.dev/;
            script-src ${cspUrl} ${cspSource} https://*.github.dev/ https://github.dev/ 'nonce-${nonce}'; 
            style-src 'unsafe-inline' ${cspUrl} ${cspSource} https://*.github.dev/ https://github.dev/;
            font-src ${cspUrl} ${cspSource} https://*.github.dev/ https://github.dev/;
        `;
    html = `<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>GenAIScript Script Runner</title>
    <meta http-equiv="Content-Security-Policy" content="${csp}" />
    <link rel="icon" href="${faviconUri}" type="image/svg+xml" />
    <link href="${stylesheetUri}" rel="stylesheet" />
    <link href="${codeIconsUri}" rel="stylesheet" id="vscode-codicon-stylesheet" />
    <script nonce="${nonce}">
        window.litNonce = ${JSON.stringify(nonce)};
        window.genaiscript = ${JSON.stringify({ apiKey: sessionApiKey, base: authority })};
    </script>
</head>
<body>
    <div id="root" class="vscode-body"></div>
    <script type="module" src="${scriptUri}" nonce="${nonce}"></script>
</body>
</html>
`;
  }

  panel.webview.html = html;
  return panel;
}

export function activeWebview(state: ExtensionState) {
  const { context } = state;
  const { subscriptions } = context;
  subscriptions.push(
    registerCommand("genaiscript.request.open.view", async () => {
      await state.showWebview();
    }),
  );
}
