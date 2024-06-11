import { ExtensionState } from "./state"
import * as vscode from "vscode"
import {
    AZURE_OPENAI_TOKEN_SCOPES,
    CancelError,
    errorMessage,
    isCancelError,
    logVerbose,
} from "genaiscript-core"
import { AccessToken, TokenCredential } from "@azure/identity"

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

    get signedIn() {
        return !!this._session?.accessToken
    }

    async signIn(): Promise<boolean> {
        if (this._session) return true

        try {
            const session = await vscode.authentication.getSession(
                "microsoft",
                AZURE_OPENAI_TOKEN_SCOPES,
                {
                    createIfNone: true,
                    forceNewSession: true,
                }
            )
            this._session = session
            return !!this._session
        } catch (e) {
            if (!isCancelError(e)) throw e

            const msg = errorMessage(e)
            vscode.window.showErrorMessage(msg)
            return false
        }
    }

    async getOpenAIToken() {
        await this.signIn()
        return this._session?.accessToken
    }
}
