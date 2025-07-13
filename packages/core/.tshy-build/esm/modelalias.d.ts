import type { PromptScriptRunOptions } from "./server/messages.js";
import type { PromptScript } from "./types.js";
/**
 * Configures model provider aliases based on the given provider ID and source type.
 *
 * @param id Identifier of the model provider to look up.
 * @param source The origin of the configuration, such as "cli", "env", "config", or "script".
 * @throws Error if the model provider with the specified ID is not found.
 *
 * Sets model aliases for the detected provider using the runtime host. If
 * the provider contains alias definitions, they are mapped and stored.
 */
export declare function applyModelProviderAliases(id: string, source: "cli" | "env" | "config" | "script"): void;
/**
 * Applies model options to the runtime host by setting model aliases and linking them
 * to the specified source. Handles provider-specific aliases, primary model identifiers,
 * small model, vision model, and additional key-value pair aliases.
 *
 * @param options - Configuration object with potential model-related keys:
 *   - `model`: Identifier for the primary model.
 *   - `smallModel`: Identifier for the smaller model variant.
 *   - `visionModel`: Identifier for a vision-specific model.
 *   - `modelAlias`: Array of key-value pairs for additional model aliases.
 *   - `provider`: Identifier for the model provider to apply aliases for.
 * @param source - The origin of the configuration (e.g., `cli`, `env`, `config`, or `script`).
 */
export declare function applyModelOptions(options: Partial<Pick<PromptScriptRunOptions, "model" | "smallModel" | "visionModel" | "modelAlias" | "provider">>, source: "cli" | "env" | "config" | "script"): void;
/**
 * Applies model aliases defined within a provided script to the runtime environment.
 *
 * @param script - The script object containing model configurations and aliases.
 *                 The script may include options for models and specific aliases
 *                 to be applied to the runtime.
 *
 * Description:
 *  - Uses `applyModelOptions` to process model configurations specified in the script.
 *  - If the script defines additional `modelAliases`, each is added to the runtime
 *    environment using `runtimeHost.setModelAlias`, where the alias name and value are registered.
 */
export declare function applyScriptModelAliases(script: PromptScript): void;
/**
 * Logs the registered model aliases to the console.
 *
 * @param options - Optional parameters for logging behavior.
 * @param options.all - If true, logs all aliases, including those with the "default" source.
 */
export declare function logModelAliases(options?: {
    all?: boolean;
}): void;
//# sourceMappingURL=modelalias.d.ts.map