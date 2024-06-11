import { ExtensionState } from "./state"
import * as vscode from "vscode"
import { AZURE_OPENAI_TOKEN_SCOPES, errorMessage } from "genaiscript-core"

export class AzureManager {
    private _session: vscode.AuthenticationSession

    constructor(readonly state: ExtensionState) {
        const { context } = state
        const { subscriptions } = context
        subscriptions.push(
            vscode.authentication.onDidChangeSessions((e) => {
                if (e.provider.id === "microsoft") this._session = undefined
            })
        )
    }

    async getOpenAIToken() {
        if (this._session) return this._session.accessToken

        try {
            const session = await vscode.authentication.getSession(
                "microsoft",
                AZURE_OPENAI_TOKEN_SCOPES,
                {
                    createIfNone: false,
                    silent: true,
                }
            )
            this._session = session
            return this._session.accessToken
        } catch {}

        try {
            // get new session
            const session = await vscode.authentication.getSession(
                "microsoft",
                AZURE_OPENAI_TOKEN_SCOPES,
                {
                    forceNewSession: true,
                    clearSessionPreference: true,
                }
            )
            this._session = session
            return this._session.accessToken
        } catch (e) {
            const msg = errorMessage(e)
            vscode.window.showErrorMessage(msg)
            throw e
        }
    }
}
