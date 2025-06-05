import { HostConfiguration } from "./hostconfiguration.js";
import { ResolvedLanguageModelConfiguration } from "./server/messages.js";
import { CancellationOptions } from "./cancellation.js";
export declare function mergeHostConfigs(
  config: HostConfiguration,
  parsed: HostConfiguration,
): HostConfiguration;
/**
 * Reads and resolves the configuration for the host environment.
 *
 * @param dotEnvPaths - Optional array of .env file paths to consider. If provided, these paths will be prioritized.
 *
 * Steps:
 * - Calls `resolveGlobalConfiguration` to load base configurations from default paths and files.
 * - Processes specified `.env` files to load environment variables.
 * - Validates the existence and file type of each `.env` file.
 * - Loads and overrides environment variables using `dotenv`.
 * - Parses additional defaults from the current `process.env`.
 * - Ensures unique resolution of `.env` file paths.
 *
 * @returns The resolved host configuration including merged and validated settings.
 *
 * @throws An error if any provided `.env` file is invalid, unreadable, or not a file.
 */
export declare function readHostConfig(
  dotEnvPaths: string[],
  hostConfig: HostConfiguration,
): Promise<HostConfiguration>;
/**
 * Resolves and outputs environment information for language model providers.
 * @param provider - Filters by specific provider. If not provided, resolves all providers.
 * @param options - Configuration options:
 *   - token - Include tokens in the output. If false, tokens are masked.
 *   - error - Include errors in the output.
 *   - models - List models for each provider if supported.
 *   - hide - Exclude hidden providers from the output.
 *   - cancellation options - Additional cancellation options.
 * @returns Sorted list of resolved language model configurations, including errors if applicable.
 * @throws An error if there is an issue retrieving or processing configurations for a provider.
 */
export declare function resolveLanguageModelConfigurations(
  provider: string,
  options?: {
    token?: boolean;
    error?: boolean;
    models?: boolean;
    hide?: boolean;
  } & CancellationOptions,
): Promise<ResolvedLanguageModelConfiguration[]>;
//# sourceMappingURL=config.d.ts.map
