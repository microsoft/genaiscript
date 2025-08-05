"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAzureTokenResolver = createAzureTokenResolver;
const constants_js_1 = require("./constants.js");
const host_js_1 = require("./host.js");
const util_js_1 = require("./util.js");
const error_js_1 = require("./error.js");
const cancellation_js_1 = require("./cancellation.js");
const identity_1 = require("@azure/identity");
const debug_js_1 = require("./debug.js");
const dbg = (0, debug_js_1.genaiscriptDebug)("azure:token");
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
            credential = new identity_1.AzureCliCredential();
            break;
        case "env":
            dbg("credentialsType is env");
            credential = new identity_1.EnvironmentCredential();
            break;
        case "powershell":
            dbg("credentialsType is powershell");
            credential = new identity_1.AzurePowerShellCredential();
            break;
        case "devcli":
            dbg("credentialsType is devcli");
            credential = new identity_1.AzureDeveloperCliCredential();
            break;
        case "managedidentity":
            dbg("credentialsType is managedidentity");
            credential = new identity_1.ManagedIdentityCredential();
            break;
        case "workloadidentity":
            dbg("credentialsType is workloadidentity");
            credential = new identity_1.WorkloadIdentityCredential();
            break;
        case "default":
            dbg("credentialsType is default");
            credential = new identity_1.DefaultAzureCredential(); // CodeQL [SM05139] The user explicitly requested this credential type so the user has a good reason to use it.
            break;
        default:
            // Check if the environment is local/development
            // also: https://nodejs.org/en/learn/getting-started/nodejs-the-difference-between-development-and-production
            if (process.env.NODE_ENV === "development") {
                dbg("node_env development: credentialsType is default");
                credential = new identity_1.DefaultAzureCredential(); // CodeQL [SM05139] Okay use of DefaultAzureCredential as it is only used in development........................................
            }
            else {
                dbg(`node_env unspecified: credentialsType is env, cli, devcli, powershell`);
                credential = new identity_1.ChainedTokenCredential(new identity_1.EnvironmentCredential(), new identity_1.AzureCliCredential(), new identity_1.AzureDeveloperCliCredential(), new identity_1.AzurePowerShellCredential());
            }
            break;
    }
    // Obtain the Azure token
    const abortSignal = (0, cancellation_js_1.toSignal)(cancellationToken);
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
            : Date.now() + constants_js_1.AZURE_TOKEN_EXPIRATION,
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
        if ((0, host_js_1.isAzureTokenExpired)(this._token)) {
            dbg("azure token expired");
            this._token = undefined;
            this._error = undefined;
        }
        if (this._token || this._error) {
            dbg("returning cached token or error");
            return { token: this._token, error: this._error };
        }
        if (!this._resolver) {
            const runtimeHost = (0, host_js_1.resolveRuntimeHost)();
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
                (0, util_js_1.logError)(err);
                this._resolver = undefined;
                this._token = undefined;
                this._error = (0, error_js_1.serializeError)(err);
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
function createAzureTokenResolver(name, envName, scopes) {
    return new AzureTokenResolverImpl(name, envName, scopes);
}
//# sourceMappingURL=azuretoken.js.map