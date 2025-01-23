import * as vscode from "vscode"
import { TOOL_ID, TOOL_NAME } from "../../core/src/constants"
import { ExtensionState } from "./state"
import { registerCommand } from "./commands"
import { Utils } from "vscode-uri"
import { deleteUndefinedValues } from "../../core/src/cleaners"
import { assert } from "../../core/src/util"

async function createWebview(state: ExtensionState): Promise<vscode.Webview> {
    const { host, sessionApiKey, context } = state
    const { externalUrl } = await host.server.client()

    const panel = vscode.window.createWebviewPanel(
        TOOL_ID,
        TOOL_NAME,
        vscode.ViewColumn.One,
        {
            localResourceRoots: [],
            enableScripts: true,
            retainContextWhenHidden: true,
        }
    )
    context.subscriptions.push(panel)

    let html: string
    const web = vscode.env.uiKind === vscode.UIKind.Web
    if (web) {
        assert(!state.sessionApiKey)
        html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GenAIScript View Holder</title>
    <style>
        body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
        iframe { width: 100%; height: 100%; border: none; }
    </style>
</head>
<body><iframe sandbox="allow-scripts allow-same-origin allow-forms" src="${externalUrl}?view=results"></iframe></body>
</html>`
    } else {
        const { authority } = host.server
        const authorityUri = await vscode.env.asExternalUri(
            vscode.Uri.parse(authority)
        )
        const faviconUri = Utils.joinPath(authorityUri, "favicon.svg")
        const stylesheetUri = Utils.joinPath(authorityUri, "built/markdown.css")
        const scriptUri = Utils.joinPath(authorityUri, "built/web.mjs")
        html = `<!doctype html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>GenAIScript Script Runner</title>
        <link rel="icon" href="${faviconUri}" type="image/svg+xml" />
        <link href="${stylesheetUri}" rel="stylesheet">
        <script type="module">
            self.genaiscript = ${JSON.stringify(deleteUndefinedValues({ apiKey: sessionApiKey, base: authority }))};
        </script>
    </head>
    <body>
        <div id="root" class="vscode-body"></div>
        <script type="module" src="${scriptUri}"></script>
    </body>
</html>
`
    }

    panel.webview.html = html
    return panel.webview
}

export function activeWebview(state: ExtensionState) {
    const { context } = state
    const { subscriptions } = context
    subscriptions.push(
        registerCommand("genaiscript.request.open.view", async () => {
            await createWebview(state)
        })
    )
}
