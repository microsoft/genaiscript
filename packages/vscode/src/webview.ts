import * as vscode from "vscode"
import { TOOL_ID, TOOL_NAME } from "../../core/src/constants"
import { ExtensionState } from "./state"
import { registerCommand } from "./commands"

async function createWebview(state: ExtensionState): Promise<vscode.Webview> {
    const { host, sessionApiKey, context } = state
    await host.server.client()

    const { authority } = host.server
    const webview = vscode.window.createWebviewPanel(
        TOOL_ID,
        TOOL_NAME,
        vscode.ViewColumn.One,
        {
            localResourceRoots: [vscode.Uri.parse(authority)],
            enableScripts: true,
            retainContextWhenHidden: true,
        }
    )
    context.subscriptions.push(webview)
    webview.webview.html = `<!doctype html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>GenAIScript Script Runner</title>
        <link rel="icon" href="favicon.svg" type="image/svg+xml" />
        <link href="${authority}/built/markdown.css" rel="stylesheet">
        <script type="module">
            self.genaiscript = ${JSON.stringify({ apiKey: sessionApiKey, base: authority })};
        </script>
    </head>
    <body>
        <div id="root" class="vscode-body"></div>
        <script type="module" src="${authority}/built/web.mjs"></script>
    </body>
</html>
`
    return webview.webview
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
