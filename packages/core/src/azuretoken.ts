import debug from "debug"
const dbg = debug("genaiscript:azuretoken")

import { AZURE_TOKEN_EXPIRATION } from "../../core/src/constants"
import {
    AuthenticationToken,
    AzureTokenResolver,
    isAzureTokenExpired,
    runtimeHost,
} from "../../core/src/host"
import { logError, logVerbose } from "../../core/src/util"
import type { TokenCredential } from "@azure/identity"
import { serializeError } from "../../core/src/error"
import {
    CancellationOptions,
    CancellationToken,
    toSignal,
} from "../../core/src/cancellation"
import { AzureCredentialsType } from "../../core/src/server/messages"

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
async function createAzureToken(
    scopes: readonly string[],
    credentialsType: AzureCredentialsType,
    cancellationToken?: CancellationToken
): Promise<AuthenticationToken> {
    // Dynamically import DefaultAzureCredential from the Azure SDK
    dbg("dynamically importing Azure SDK credentials")
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
            dbg("credentialsType is cli")
            credential = new AzureCliCredential()
            break
        case "env":
            dbg("credentialsType is env")
            credential = new EnvironmentCredential()
            break
        case "powershell":
            dbg("credentialsType is powershell")
            credential = new AzurePowerShellCredential()
            break
        case "devcli":
            dbg("credentialsType is devcli")
            credential = new AzureDeveloperCliCredential()
            break
        case "managedidentity":
            dbg("credentialsType is managedidentity")
            credential = new ManagedIdentityCredential()
            break
        case "workloadidentity":
            dbg("credentialsType is workloadidentity")
            credential = new WorkloadIdentityCredential()
            break
        default:
            credential = new DefaultAzureCredential()
            dbg("credentialsType is default")
            break
    }

    // Obtain the Azure token using the DefaultAzureCredential
    const abortSignal = toSignal(cancellationToken)
    dbg("obtaining Azure token with provided scopes and abort signal")
    const azureToken = await credential.getToken(scopes.slice(), {
        abortSignal,
    })

    // Prepare the result token object with the token and expiration timestamp
    const res = {
        credential,
        token: azureToken.token,
        // Use provided expiration timestamp or default to a constant expiration time
        expiresOnTimestamp: azureToken.expiresOnTimestamp
            ? azureToken.expiresOnTimestamp
            : Date.now() + AZURE_TOKEN_EXPIRATION,
    }

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
        if (this._resolver) {
            return this._resolver
        }

        // cached
        const { cancellationToken } = options || {}

        if (isAzureTokenExpired(this._token)) {
            dbg("azure token expired")
            this._token = undefined
            this._error = undefined
        }
        if (this._token || this._error) {
            dbg("returning cached token or error")
            return { token: this._token, error: this._error }
        }
        if (!this._resolver) {
            const scope = await runtimeHost.readSecret(this.envName)
            dbg(`reading secret for envName: ${this.envName}`)
            const scopes = scope ? scope.split(",") : this.scopes
            this._resolver = createAzureToken(
                scopes,
                credentialsType,
                cancellationToken
            )
                .then((res) => {
                    dbg("creating Azure token")
                    this._token = res
                    this._error = undefined
                    this._resolver = undefined

                    logVerbose(
                        `${this.name}: ${credentialsType || ""} token (${scopes.join(",")}) expires on ${new Date(res.expiresOnTimestamp).toUTCString()}`
                    )
                    return { token: this._token, error: this._error }
                })
                .catch((err) => {
                    dbg(`error occurred: ${err}`)
                    logError(err)
                    this._resolver = undefined
                    this._token = undefined
                    this._error = serializeError(err)
                    return { token: this._token, error: this._error }
                })
        }
        return this._resolver
    }
}

/**
 * Creates an instance of AzureTokenResolver.
 *
 * @param name - The name identifier for the token resolver.
 * @param envName - The environment name from which to read the secret.
 * @param scopes - An array of scopes required for the Azure authentication token.
 * @returns An instance of AzureTokenResolver, which is responsible for obtaining and managing Azure authentication tokens.
 */
export function createAzureTokenResolver(
    name: string,
    envName: string,
    scopes: readonly string[]
): AzureTokenResolver {
    return new AzureTokenResolverImpl(name, envName, scopes)
}
