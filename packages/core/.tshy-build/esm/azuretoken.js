// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import { AZURE_TOKEN_EXPIRATION } from "./constants.js";
import { isAzureTokenExpired, runtimeHost, } from "./host.js";
import { logError } from "./util.js";
import { serializeError } from "./error.js";
import { toSignal } from "./cancellation.js";
import { AzureCliCredential, AzureDeveloperCliCredential, AzurePowerShellCredential, ChainedTokenCredential, DefaultAzureCredential, EnvironmentCredential, ManagedIdentityCredential, WorkloadIdentityCredential, } from "@azure/identity";
import { genaiscriptDebug } from "./debug.js";
const dbg = genaiscriptDebug("azure:token");
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
async function createAzureToken(scopes, credentialsType, cancellationToken) {
    let credential;
    switch (credentialsType) {
        case "cli":
            dbg("credentialsType is cli");
            credential = new AzureCliCredential();
            break;
        case "env":
            dbg("credentialsType is env");
            credential = new EnvironmentCredential();
            break;
        case "powershell":
            dbg("credentialsType is powershell");
            credential = new AzurePowerShellCredential();
            break;
        case "devcli":
            dbg("credentialsType is devcli");
            credential = new AzureDeveloperCliCredential();
            break;
        case "managedidentity":
            dbg("credentialsType is managedidentity");
            credential = new ManagedIdentityCredential();
            break;
        case "workloadidentity":
            dbg("credentialsType is workloadidentity");
            credential = new WorkloadIdentityCredential();
            break;
        case "default":
            dbg("credentialsType is default");
            credential = new DefaultAzureCredential(); // CodeQL [SM05139] The user explicitly requested this credential type so the user has a good reason to use it.
            break;
        default:
            // Check if the environment is local/development
            // also: https://nodejs.org/en/learn/getting-started/nodejs-the-difference-between-development-and-production
            if (process.env.NODE_ENV === "development") {
                dbg("node_env development: credentialsType is default");
                credential = new DefaultAzureCredential(); // CodeQL [SM05139] Okay use of DefaultAzureCredential as it is only used in development........................................
            }
            else {
                dbg(`node_env unspecified: credentialsType is env, cli, devcli, powershell`);
                credential = new ChainedTokenCredential(new EnvironmentCredential(), new AzureCliCredential(), new AzureDeveloperCliCredential(), new AzurePowerShellCredential());
            }
            break;
    }
    // Obtain the Azure token
    const abortSignal = toSignal(cancellationToken);
    dbg(`get token for %o`, scopes);
    const azureToken = await credential.getToken(scopes.slice(), {
        abortSignal,
    });
    // Prepare the result token object with the token and expiration timestamp
    const res = {
        credential,
        token: azureToken.token,
        // Use provided expiration timestamp or default to a constant expiration time
        expiresOnTimestamp: azureToken.expiresOnTimestamp
            ? azureToken.expiresOnTimestamp
            : Date.now() + AZURE_TOKEN_EXPIRATION,
    };
    return res;
}
class AzureTokenResolverImpl {
    name;
    envName;
    scopes;
    _token;
    _error;
    _resolver;
    constructor(name, envName, scopes) {
        this.name = name;
        this.envName = envName;
        this.scopes = scopes;
    }
    get error() {
        return this._error;
    }
    async token(credentialsType, options) {
        if (this._resolver) {
            return this._resolver;
        }
        // cached
        const { cancellationToken } = options || {};
        if (isAzureTokenExpired(this._token)) {
            dbg("azure token expired");
            this._token = undefined;
            this._error = undefined;
        }
        if (this._token || this._error) {
            dbg("returning cached token or error");
            return { token: this._token, error: this._error };
        }
        if (!this._resolver) {
            const scope = await runtimeHost.readSecret(this.envName);
            dbg(`reading secret for envName: ${this.envName}`);
            const scopes = scope ? scope.split(",") : this.scopes;
            this._resolver = createAzureToken(scopes, credentialsType, cancellationToken)
                .then((res) => {
                this._token = res;
                this._error = undefined;
                this._resolver = undefined;
                dbg(`${this.name}: ${credentialsType || ""} token (${scopes.join(",")}) expires on ${new Date(res.expiresOnTimestamp).toUTCString()}`);
                return { token: this._token, error: this._error };
            })
                .catch((err) => {
                dbg(`error occurred: ${err}`);
                logError(err);
                this._resolver = undefined;
                this._token = undefined;
                this._error = serializeError(err);
                return { token: this._token, error: this._error };
            });
        }
        return this._resolver;
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
export function createAzureTokenResolver(name, envName, scopes) {
    return new AzureTokenResolverImpl(name, envName, scopes);
}
//# sourceMappingURL=azuretoken.js.map