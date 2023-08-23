import * as vscode from "vscode"
import { ExtensionState } from "./state"
import { getNonce, getUri } from "./webviewutils"

class RunnerViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = "coarch.runner"
    private _view?: vscode.WebviewView

    constructor(readonly state: ExtensionState) {}

    resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext<unknown>,
        token: vscode.CancellationToken
    ): void | Thenable<void> {
        this._view = webviewView

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.state.context.extensionUri],
        }

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview)

        webviewView.webview.onDidReceiveMessage((data) => {
            switch (
                data.type
                //case 'colorSelected':
                //	{
                //		vscode.window.activeTextEditor?.insertSnippet(new vscode.SnippetString(`#${data.value}`));
                //		break;
                //	}
            ) {
            }
        })
    }

    get extensionUri() {
        return this.state.context.extensionUri
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
        const webviewUri = getUri(
            webview,
            this.extensionUri,
            "built",
            "webview.js"
        )

        // Use a nonce to only allow a specific script to be run.
        const nonce = getNonce()

        return `      <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}';">
            <title>Hello World!</title>
          </head>
          <body>
            <h1>Hello World!</h1>
                      <vscode-button id="howdy">Howdy!</vscode-button>
                      <script type="module" nonce="${nonce}" src="${webviewUri}"></script>
          </body>
        </html>`
    }
}

export function activateRunnerView(state: ExtensionState) {
    const { context } = state
    const { subscriptions } = context

    const provider = new RunnerViewProvider(state)
    subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            RunnerViewProvider.viewType,
            provider
        )
    )
}
