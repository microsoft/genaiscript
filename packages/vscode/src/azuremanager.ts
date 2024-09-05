import { AZURE_OPENAI_TOKEN_SCOPES } from "../../core/src/constants"
import { errorMessage } from "../../core/src/error"
import { ExtensionState } from "./state"
import * as vscode from "vscode"

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

        // select account
        const accounts = await vscode.authentication.getAccounts("microsoft")
        let account: vscode.AuthenticationSessionAccountInformation
        if (accounts?.length === 1) account = accounts[0]
        else if (accounts?.length > 1) {
            let res = await vscode.window.showQuickPick(
                accounts.map(
                    (a) =>
                        <
                            vscode.QuickPickItem & {
                                account: vscode.AuthenticationSessionAccountInformation
                            }
                        >{
                            label: a.label,
                            account,
                        },
                    "Select account"
                )
            )
            if (res === undefined) return undefined
            account = res.account
        }

        try {
            const session = await vscode.authentication.getSession(
                "microsoft",
                AZURE_OPENAI_TOKEN_SCOPES,
                {
                    createIfNone: false,
                    silent: true,
                    account,
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
                    account,
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
