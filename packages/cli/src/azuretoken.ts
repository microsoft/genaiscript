import { AZURE_TOKEN_EXPIRATION } from "../../core/src/constants"
import {
    AuthenticationToken,
    AzureCredentialsType,
    AzureTokenResolver,
    isAzureTokenExpired,
    runtimeHost,
} from "../../core/src/host"
import { logVerbose } from "../../core/src/util"
import type { TokenCredential } from "@azure/identity"
import { serializeError } from "../../core/src/error"
import {
    CancellationOptions,
    CancellationToken,
    toSignal,
} from "../../core/src/cancellation"

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
    cancellationToken?: CancellationToken
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
    const abortSignal = toSignal(cancellationToken)
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
        `azure: ${credentialsType || ""} token (${scopes.join(",")}) expires on ${new Date(res.expiresOnTimestamp).toUTCString()}`
    )

    return res
}

class AzureTokenResolverImpl implements AzureTokenResolver {
    _token: AuthenticationToken
    _error: any
    _resolver: Promise<{ token?: AuthenticationToken; error?: SerializedError }>

    constructor(
        public readonly name: string,
        public readonly envName: string,
        public readonly scopes: readonly string[]
    ) {}

    get error(): SerializedError {
        return this._error
    }

    async token(
        credentialsType: AzureCredentialsType,
        options?: CancellationOptions
    ): Promise<{ token?: AuthenticationToken; error?: SerializedError }> {
        // cached
        const { cancellationToken } = options || {}

        if (isAzureTokenExpired(this._token)) {
            logVerbose(`azure: ${this.name} token expired`)
            this._token = undefined
            this._error = undefined
        }
        if (this._token || this._error)
            return { token: this._token, error: this._error }
        if (!this._resolver) {
            const scope = await runtimeHost.readSecret(this.envName)
            const scopes = scope ? scope.split(",") : this.scopes
            this._resolver = createAzureToken(
                scopes,
                credentialsType,
                cancellationToken
            )
                .then((res) => {
                    this._token = res
                    this._error = undefined
                    this._resolver = undefined
                    return { token: this._token, error: this._error }
                })
                .catch((err) => {
                    this._resolver = undefined
                    this._token = undefined
                    this._error = serializeError(err)
                    return { token: this._token, error: this._error }
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
