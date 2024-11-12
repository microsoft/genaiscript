import { AZURE_TOKEN_EXPIRATION } from "../../core/src/constants"
import {
    AuthenticationToken,
    AzureCredentialsType,
    AzureTokenResolver,
    isAzureTokenExpired,
} from "../../core/src/host"
import { logVerbose } from "../../core/src/util"
import type { TokenCredential } from "@azure/identity"

/**
 * This module provides functions to handle Azure authentication tokens,
 * including checking expiration and creating new tokens using Azure Identity SDK.
 */

/**
 * Creates a new Azure authentication token.
 *
 * @param signal - An AbortSignal to allow aborting the token creation process.
 * @returns A promise that resolves to an AuthenticationToken.
 *
 * Utilizes DefaultAzureCredential from the Azure Identity SDK to obtain the token.
 * Logs the expiration time of the token for debugging or informational purposes.
 */
export async function createAzureToken(
    scopes: readonly string[],
    credentialsType: AzureCredentialsType,
    abortSignal: AbortSignal
): Promise<AuthenticationToken> {
    // Dynamically import DefaultAzureCredential from the Azure SDK
    const {
        DefaultAzureCredential,
        EnvironmentCredential,
        AzureCliCredential,
        ManagedIdentityCredential,
        AzurePowerShellCredential,
        AzureDeveloperCliCredential,
        WorkloadIdentityCredential,
    } = await import("@azure/identity")

    let credential: TokenCredential
    switch (credentialsType) {
        case "cli":
            credential = new AzureCliCredential()
            break
        case "env":
            credential = new EnvironmentCredential()
            break
        case "powershell":
            credential = new AzurePowerShellCredential()
            break
        case "devcli":
            credential = new AzureDeveloperCliCredential()
            break
        case "managedidentity":
            credential = new ManagedIdentityCredential()
            break
        case "workloadidentity":
            credential = new WorkloadIdentityCredential()
            break
        default:
            credential = new DefaultAzureCredential()
            break
    }
    // Obtain the Azure token using the DefaultAzureCredential
    const azureToken = await credential.getToken(scopes.slice(), {
        abortSignal,
    })

    // Prepare the result token object with the token and expiration timestamp
    const res = {
        token: azureToken.token,
        // Use provided expiration timestamp or default to a constant expiration time
        expiresOnTimestamp: azureToken.expiresOnTimestamp
            ? azureToken.expiresOnTimestamp
            : Date.now() + AZURE_TOKEN_EXPIRATION,
    }

    // Log the expiration time of the token
    logVerbose(
        `azure token expires at ${new Date(res.expiresOnTimestamp).toLocaleString()}`
    )

    return res
}

class AzureTokenResolverImpl implements AzureTokenResolver {
    _token: AuthenticationToken
    _resolver: Promise<AuthenticationToken>

    constructor(
        public readonly name: string,
        public readonly envName: string,
        public readonly scopes: readonly string[]
    ) {}

    async token(
        credentialsType: AzureCredentialsType,
        optoins?: { signal?: AbortSignal }
    ): Promise<AuthenticationToken> {
        // cached
        const { signal } = optoins || {}

        if (isAzureTokenExpired(this._token)) this._token = undefined
        if (this._token) return this._token
        if (!this._resolver) {
            const scope = process.env[this.envName]
            const scopes = scope ? scope.split(",") : this.scopes
            this._resolver = createAzureToken(
                scopes,
                credentialsType,
                signal || new AbortController().signal
            ).then((res) => {
                this._token = res
                this._resolver = undefined
                return res
            })
        }
        return this._resolver
    }
}

export function createAzureTokenResolver(
    name: string,
    envName: string,
    scopes: readonly string[]
): AzureTokenResolver {
    return new AzureTokenResolverImpl(name, envName, scopes)
}
