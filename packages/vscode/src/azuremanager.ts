import {
    AzureSubscription,
    VSCodeAzureSubscriptionProvider,
} from "@microsoft/vscode-azext-azureauth"
import { ExtensionState } from "./state"
import * as vscode from "vscode"
import {
    AZURE_OPENAI_TOKEN_SCOPE,
    CancelError,
    errorMessage,
    isCancelError,
} from "genaiscript-core"
import { TokenCredential } from "@azure/identity"

export class AzureManager {
    private _vscodeAzureSubscriptionProvider:
        | VSCodeAzureSubscriptionProvider
        | undefined
    private _subscription: AzureSubscription

    constructor(readonly state: ExtensionState) {}

    get subscription() {
        return this._subscription
    }

    async signIn(): Promise<TokenCredential> {
        if (this._subscription) return this._subscription.credential

        if (!this._vscodeAzureSubscriptionProvider)
            this._vscodeAzureSubscriptionProvider =
                new VSCodeAzureSubscriptionProvider()

        try {
            if (!this._vscodeAzureSubscriptionProvider.isSignedIn()) {
                const signed =
                    await this._vscodeAzureSubscriptionProvider.signIn()
                if (!signed) throw new CancelError("Azure sign in failed")
            }
            const subscriptions =
                await this._vscodeAzureSubscriptionProvider.getSubscriptions()
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
        const credential = await this.signIn()
        const token = await credential.getToken([AZURE_OPENAI_TOKEN_SCOPE], {
            abortSignal: signal,
        })
        return token.token
    }
}