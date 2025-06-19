import debug from "debug";
const dbg = debug("genaiscript:modelalias");
import { parseKeyValuePair } from "../../core/src/fence";
import { runtimeHost } from "../../core/src/host";
import { PromptScriptRunOptions } from "./server/messages";
import { providerFeatures } from "./features";

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
export function applyModelProviderAliases(id: string, source: "cli" | "env" | "config" | "script") {
  dbg(`apply provider ${id} from ${source}`);
  if (!id) return;
  const provider = providerFeatures(id);
  if (!provider) throw new Error(`Model provider not found: ${id}`);
  for (const [key, value] of Object.entries(provider.aliases || {}))
    runtimeHost.setModelAlias(source, key, provider.id + ":" + value);
}

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
export function applyModelOptions(
  options: Partial<
    Pick<PromptScriptRunOptions, "model" | "smallModel" | "visionModel" | "modelAlias" | "provider">
  >,
  source: "cli" | "env" | "config" | "script",
) {
  dbg(`apply model options from ${source}`, options);
  if (options.provider) applyModelProviderAliases(options.provider, source);
  if (options.model) runtimeHost.setModelAlias(source, "large", options.model);
  if (options.smallModel) runtimeHost.setModelAlias(source, "small", options.smallModel);
  if (options.visionModel) runtimeHost.setModelAlias(source, "vision", options.visionModel);
  for (const kv of options.modelAlias || []) {
    const aliases = parseKeyValuePair(kv);
    for (const [key, value] of Object.entries(aliases))
      runtimeHost.setModelAlias(source, key, value);
  }
}

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
export function applyScriptModelAliases(script: PromptScript) {
  applyModelOptions(script, "script");
  if (script.modelAliases)
    Object.entries(script.modelAliases).forEach(([name, alias]) => {
      runtimeHost.setModelAlias("script", name, alias);
    });
}

/**
 * Logs the registered model aliases to the console.
 *
 * @param options - Optional parameters for logging behavior.
 * @param options.all - If true, logs all aliases, including those with the "default" source.
 */
export function logModelAliases(options?: { all?: boolean }) {
  const { all } = options || {};
  let aliases = Object.entries(runtimeHost.modelAliases);
  if (!all) aliases = aliases.filter(([, value]) => value.source !== "default");
  aliases.forEach(([key, value]) => dbg(`${key}: ${value.model} (${value.source})`));
}
