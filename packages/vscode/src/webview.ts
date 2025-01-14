import * as vscode from "vscode"
import { TOOL_ID, TOOL_NAME } from "../../core/src/constants"
import { ExtensionState } from "./state"

export async function createWebview(
    state: ExtensionState
): Promise<vscode.Webview> {
    const webview = vscode.window.createWebviewPanel(
        TOOL_ID,
        TOOL_NAME,
        vscode.ViewColumn.One,
        {
            enableScripts: true,
        }
    )
    const { host, sessionApiKey } = state
    await host.server.client()
    const { authority } = host.server
    webview.webview.html = `<!doctype html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>GenAIScript Script Runner</title>
        <link rel="icon" href="favicon.svg" type="image/svg+xml" />
        <link href="${authority}/built/markdown.css" rel="stylesheet">
        <script type="module">self.genaiscriptApiKey = ${JSON.stringify(sessionApiKey)};</script>
    </head>
    <body>
        <div id="root" class="vscode-body"></div>
        <vscode-dev-toolbar></vscode-dev-toolbar>
        <script type="module" src="${authority}/built/web.mjs"></script>
    </body>
</html>
`
    return webview.webview
}
