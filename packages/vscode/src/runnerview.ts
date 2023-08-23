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
        const scriptUri = getUri(webview, this.extensionUri, "media", "main.js")

        // Do the same for the stylesheet.
        const styleResetUri = getUri(
            webview,
            this.extensionUri,
            "media",
            "reset.css"
        )
        const styleVSCodeUri = getUri(
            webview,
            this.extensionUri,
            "media",
            "vscode.css"
        )
        const styleMainUri = getUri(
            webview,
            this.extensionUri,
            "media",
            "main.css"
        )

        // Use a nonce to only allow a specific script to be run.
        const nonce = getNonce()

        return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
					Use a content security policy to only allow loading styles from our extension directory,
					and only allow scripts that have a specific nonce.
					(See the 'webview-sample' extension sample for img-src content security policy examples)
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
				<link href="${styleMainUri}" rel="stylesheet">

				<title>Cat Colors</title>
			</head>
			<body>
				<ul class="color-list">
				</ul>

				<button class="add-color-button">Add Color</button>

				<script nonce="${nonce}" src="${scriptUri}"></script>
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
