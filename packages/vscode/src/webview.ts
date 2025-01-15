import * as vscode from "vscode"
import { TOOL_ID, TOOL_NAME } from "../../core/src/constants"
import { ExtensionState } from "./state"
import { registerCommand } from "./commands"

async function createWebview(state: ExtensionState): Promise<vscode.Webview> {
    const { host, sessionApiKey, context } = state
    await host.server.client()

    const { authority } = host.server

    const serverUri = await vscode.env.asExternalUri(
        vscode.Uri.parse(`${authority}/`)
    )
    const faviconUri = await vscode.env.asExternalUri(
        vscode.Uri.parse(`${authority}/favicon.svg`)
    )
    const stylesheetUri = await vscode.env.asExternalUri(
        vscode.Uri.parse(`${authority}/built/markdown.css`)
    )
    const scriptUri = await vscode.env.asExternalUri(
        vscode.Uri.parse(`${authority}/built/web.mjs`)
    )

    const panel = vscode.window.createWebviewPanel(
        TOOL_ID,
        TOOL_NAME,
        vscode.ViewColumn.One,
        {
            localResourceRoots: [vscode.Uri.parse(authority)],
            enableScripts: true,
            retainContextWhenHidden: true,
        }
    )
    context.subscriptions.push(panel)
    panel.webview.html = `<!doctype html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>GenAIScript Script Runner</title>
        <link rel="icon" href="${faviconUri}" type="image/svg+xml" />
        <link href="${stylesheetUri}" rel="stylesheet">
        <script type="module">
            self.genaiscript = ${JSON.stringify({ apiKey: sessionApiKey, base: authority })};
        </script>
    </head>
    <body>
        <div id="root" class="vscode-body"></div>
        <script type="module" src="${scriptUri}"></script>
    </body>
</html>
`
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
