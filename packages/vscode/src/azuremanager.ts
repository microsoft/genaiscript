import {
    AzureSubscription,
    VSCodeAzureSubscriptionProvider,
} from "@microsoft/vscode-azext-azureauth"
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
    private _vscodeAzureSubscriptionProvider:
        | VSCodeAzureSubscriptionProvider
        | undefined
    private _subscription: AzureSubscription
    private _token: AccessToken

    constructor(readonly state: ExtensionState) {}

    get subscription() {
        return this._subscription
    }

    get hasToken() {
        return this._token?.token !== undefined
    }

    async signIn(): Promise<TokenCredential> {
        if (this._subscription) return this._subscription.credential

        if (!this._vscodeAzureSubscriptionProvider) {
            this._vscodeAzureSubscriptionProvider =
                new VSCodeAzureSubscriptionProvider()
            this._vscodeAzureSubscriptionProvider.onDidSignOut(() => {
                this._subscription = undefined
                this._token = undefined
            })
        }

        try {
            if (!(await this._vscodeAzureSubscriptionProvider.isSignedIn())) {
                const signed =
                    await this._vscodeAzureSubscriptionProvider.signIn()
                if (!signed) throw new CancelError("Azure sign in failed")
            }
            const subscriptions =
                await this._vscodeAzureSubscriptionProvider.getSubscriptions()
            const subscriptionId = await this.state.host.readSecret(
                "AZURE_SUBSCRIPTION_ID"
            )
            if (subscriptionId) {
                const sub = subscriptions.find(
                    (s) => s.subscriptionId === subscriptionId
                )
                if (sub) {
                    this._subscription = sub
                    return sub.credential
                } else {
                    vscode.window.showErrorMessage(
                        `Azure subscription ${subscriptionId} from .env not found`
                    )
                    return undefined
                }
            }

            const sub = await vscode.window.showQuickPick(<
                (vscode.QuickPickItem & { subscription: AzureSubscription })[]
            >[
                ...subscriptions.map((s) => ({
                    label: s.name,
                    description: s.subscriptionId,
                    subscription: s,
                })),
            ])
            if (sub === undefined) {
                this._subscription = undefined
                return undefined
            }
            this._subscription = sub.subscription
            return this._subscription.credential
        } catch (e) {
            if (!isCancelError(e)) throw e

            const msg = errorMessage(e)
            vscode.window.showErrorMessage(msg)
            throw new CancelError(msg)
        }
    }

    async getOpenAIToken(options?: { signal: AbortSignal }) {
        const { signal } = options || {}

        // check expiration
        if (
            this._token &&
            this._token.expiresOnTimestamp > 0 &&
            this._token.expiresOnTimestamp > Date.now()
        ) {
            logVerbose("azure: token expired")
            this._token = undefined
        }

        if (!this._token) {
            const credential = await this.signIn()
            if (!credential) return undefined

            logVerbose("azure: new token")
            this._token = await credential.getToken(AZURE_OPENAI_TOKEN_SCOPES.slice(), {
                abortSignal: signal,
            })
        }
        return this._token.token
    }
}
