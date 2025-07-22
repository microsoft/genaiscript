/**
 * Escapes a tool name by sanitizing it according to specific rules.
 *
 * Replaces non-alphanumeric characters (excluding underscores and hyphens) with underscores.
 * Replaces hyphens with underscores.
 * Collapses multiple consecutive underscores into a single underscore.
 * Removes trailing underscores from the resulting string.
 *
 * @param name The tool name to be escaped.
 * @returns The sanitized tool name.
 */
export declare function escapeToolName(name: string): string;
/**
 * Determines if tools are supported for a given model.
 *
 * @param modelId - The identifier of the model to check tools support.
 * @returns `true` if tools are supported, `false` if not supported, or `undefined` if unknown.
 *
 * The function examines the model's provider and family from the parsed model ID.
 * It checks the `providerFeatures` data for explicit tool support configurations.
 * If no configuration is found, it applies additional restrictions based on the family name.
 * Models with family names matching the restricted patterns (e.g., "o1-mini" or "o1-preview") are not supported.
 */
export declare function isToolsSupported(modelId: string): boolean | undefined;
//# sourceMappingURL=tools.d.ts.map