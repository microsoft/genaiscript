import type { ModelConfigurations } from "./host.js";
/**
 * Generates default model configurations by aggregating model aliases and
 * merging them with pre-defined mappings from LLM configurations.
 *
 * @returns The aggregated and structured clone of model configurations.
 *
 * @param collectAliases
 *   Helper function that collects unique model aliases based on predetermined IDs
 *   and candidate aliases defined in the LLM providers.
 *   - ids: An array of strings representing predefined model identifiers.
 *
 * @param readModelAlias
 *   Helper function that reads the configuration for a specific alias.
 *   - alias: A string representing the alias to fetch the model details for.
 *
 * Function behavior:
 * - Creates a mapping of aliases to their corresponding model configurations
 *   by merging collected aliases with provider-defined ones.
 * - Ensures all resulting configurations are free of empty values.
 * - Returns a structured clone of the final configurations object.
 */
export declare function defaultModelConfigurations(): ModelConfigurations;
//# sourceMappingURL=llms.d.ts.map