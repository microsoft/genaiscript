import {
    signInToTenant,
    VSCodeAzureSubscriptionProvider,
} from "@microsoft/vscode-azext-azureauth"
import { ExtensionState } from "./state"
import * as vscode from "vscode"
import { CancelError, errorMessage, isCancelError } from "genaiscript-core"

export class AzureManager {
    private _vscodeAzureSubscriptionProvider:
        | VSCodeAzureSubscriptionProvider
        | undefined

    constructor(readonly state: ExtensionState) {}

    async signIn(): Promise<void> {
        if (!this._vscodeAzureSubscriptionProvider)
            this._vscodeAzureSubscriptionProvider =
                new VSCodeAzureSubscriptionProvider()

        try {
            const signed = await this._vscodeAzureSubscriptionProvider.signIn()
            if (!signed) throw new CancelError("Azure sign in failed")
        } catch (e) {
            if (!isCancelError(e)) throw e

            const msg = errorMessage(e)
            vscode.window.showErrorMessage(msg)
            throw new CancelError("Azure sign in failed")
        }
    }
}
