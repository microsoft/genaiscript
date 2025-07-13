import { AzureTokenResolver } from "./host.js";
/**
 * Creates an AzureTokenResolver instance for handling Azure authentication tokens.
 *
 * @param name - The name of the resolver, used for logging or identification.
 * @param envName - The environment variable name containing authentication scopes or configuration data.
 * @param scopes - The default Azure resource scopes for authentication.
 * @returns An instance of AzureTokenResolver for managing token retrieval and caching.
 */
export declare function createAzureTokenResolver(name: string, envName: string, scopes: readonly string[]): AzureTokenResolver;
//# sourceMappingURL=azuretoken.d.ts.map