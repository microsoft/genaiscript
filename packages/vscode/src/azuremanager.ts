import {
    signInToTenant,
    VSCodeAzureSubscriptionProvider,
} from "@microsoft/vscode-azext-azureauth"
import { ExtensionState } from "./state"

export class AzureManager {
    private _vscodeAzureSubscriptionProvider:
        | VSCodeAzureSubscriptionProvider
        | undefined

    constructor(readonly state: ExtensionState) {

    }

    async signIn(): Promise<void> {
        if (!this._vscodeAzureSubscriptionProvider)
            this._vscodeAzureSubscriptionProvider =
                new VSCodeAzureSubscriptionProvider()
        await signInToTenant(this._vscodeAzureSubscriptionProvider)
    }
}
