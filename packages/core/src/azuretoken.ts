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
        ChainedTokenCredential,
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
        case "default":
            dbg("credentialsType is default")
            credential = new DefaultAzureCredential() // CodeQL [SM05139] The user explicitly requested this credential type so the user has a good reason to use it.
            break
        default:
            // Check if the environment is local/development
            // also: https://nodejs.org/en/learn/getting-started/nodejs-the-difference-between-development-and-production
            if (process.env.NODE_ENV === "development") {
                dbg("node_env development: credentialsType is default")
                credential = new DefaultAzureCredential() // CodeQL [SM05139] Okay use of DefaultAzureCredential as it is only used in development........................................
            } else {
                dbg(
                    `node_env unspecified: credentialsType is env, cli, devcli, powershell`
                )
                credential = new ChainedTokenCredential(
                    new EnvironmentCredential(),
                    new AzureCliCredential(),
                    new AzureDeveloperCliCredential(),
                    new AzurePowerShellCredential()
                )
            }
            break
    }

    // Obtain the Azure token
    const abortSignal = toSignal(cancellationToken)
    dbg(`get token for %o`, scopes)
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
                    this._token = res
                    this._error = undefined
                    this._resolver = undefined

                    dbg(
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
 * Creates an AzureTokenResolver instance for handling Azure authentication tokens.
 *
 * @param name - The name of the resolver, used for logging or identification.
 * @param envName - The environment variable name containing authentication scopes or configuration data.
 * @param scopes - The default Azure resource scopes for authentication.
 * @returns An instance of AzureTokenResolver for managing token retrieval and caching.
 */
export function createAzureTokenResolver(
    name: string,
    envName: string,
    scopes: readonly string[]
): AzureTokenResolver {
    return new AzureTokenResolverImpl(name, envName, scopes)
}
