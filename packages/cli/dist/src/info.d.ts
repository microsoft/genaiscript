/**
 * Outputs basic system information including node version, platform, architecture, and process ID.
 */
export declare function systemInfo(): Promise<void>;
/**
 * Outputs environment information for model providers.
 * @param provider - The specific provider to filter by (optional).
 * @param options - Configuration options, including whether to show tokens, errors, or models. The output hides sensitive information by default.
 */
export declare function envInfo(provider: string, options: {
    token?: boolean;
    error?: boolean;
    models?: boolean;
}): Promise<void>;
/**
 * Outputs model connection information for a given script by resolving its templates.
 * Filters the scripts based on the provided script ID or filename. If no script is provided, all scripts are included.
 * @param script - The specific script ID or filename to filter by. If not provided, all scripts are included.
 * @param options - Configuration options, including whether to show tokens.
 */
export declare function scriptModelInfo(script: string, options?: {
    token?: boolean;
}): Promise<void>;
/**
 * Outputs detailed information about model aliases and their resolved configurations.
 * Each alias is expanded with its resolved counterpart.
 *
 * This function iterates over the `modelAliases` in the runtime host,
 * retrieves configuration details for each alias, resolves them using `resolveModelAlias`,
 * and outputs the data in YAML format.
 *
 * @param none This function does not require any parameters.
 */
export declare function modelAliasesInfo(options?: {
    check?: boolean;
}): Promise<void>;
/**
 * Outputs a list of models and their information for the specified provider.
 * @param provider - The specific provider to filter by (optional).
 * @param options - Configuration options, including whether to include errors, tokens, models, and the output format (JSON or YAML).
 */
export declare function modelList(provider: string, options?: {
    error?: boolean;
    format?: "json" | "yaml";
}): Promise<void>;
//# sourceMappingURL=info.d.ts.map