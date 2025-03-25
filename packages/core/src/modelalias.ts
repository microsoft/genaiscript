import { MODEL_PROVIDERS } from "../../core/src/constants"
import { parseKeyValuePair } from "../../core/src/fence"
import { runtimeHost } from "../../core/src/host"
import { logVerbose } from "../../core/src/util"
import { PromptScriptRunOptions } from "./server/messages"

/**
 * Applies model provider aliases based on the given provider ID and source.
 * 
 * This function searches for a model provider in the MODEL_PROVIDERS list using the specified ID. 
 * If found, it sets the model aliases in the runtime host for each alias associated with the provider.
 * If the provider ID is not found, an error is thrown.
 * 
 * @param id - The ID of the model provider.
 * @param source - The source from which the function is called (e.g., CLI, environment, configuration, or script).
 */
export function applyModelProviderAliases(
    id: string,
    source: "cli" | "env" | "config" | "script"
) {
    if (!id) return
    const provider = MODEL_PROVIDERS.find((p) => p.id === id)
    if (!provider) throw new Error(`Model provider not found: ${id}`)
    for (const [key, value] of Object.entries(provider.aliases || {}))
        runtimeHost.setModelAlias(source, key, provider.id + ":" + value)
}

/**
 * Applies model options based on the provided configuration.
 * This function sets model aliases in the runtime host based on the options provided.
 *
 * It supports specifying a provider, large model, small model, vision model, 
 * and additional model aliases. Each alias is parsed and applied to the runtime host.
 *
 * @param options - A partial configuration object containing model-related options.
 * @param source - The source of the options, indicating where they originated from (CLI, environment, config, or script).
 */
export function applyModelOptions(
    options: Partial<
        Pick<
            PromptScriptRunOptions,
            "model" | "smallModel" | "visionModel" | "modelAlias" | "provider"
        >
    >,
    source: "cli" | "env" | "config" | "script"
) {
    if (options.provider) applyModelProviderAliases(options.provider, source)
    if (options.model) runtimeHost.setModelAlias(source, "large", options.model)
    if (options.smallModel)
        runtimeHost.setModelAlias(source, "small", options.smallModel)
    if (options.visionModel)
        runtimeHost.setModelAlias(source, "vision", options.visionModel)
    for (const kv of options.modelAlias || []) {
        const aliases = parseKeyValuePair(kv)
        for (const [key, value] of Object.entries(aliases))
            runtimeHost.setModelAlias(source, key, value)
    }
}

/**
 * Applies model aliases defined in the given script to the runtime host.
 * This function first applies model options from the script and then 
 * sets model aliases specified in the script's modelAliases property.
 * 
 * @param script - The prompt script containing model options and aliases to apply.
 */
export function applyScriptModelAliases(script: PromptScript) {
    applyModelOptions(script, "script")
    if (script.modelAliases)
        Object.entries(script.modelAliases).forEach(([name, alias]) => {
            runtimeHost.setModelAlias("script", name, alias)
        })
}

/**
 * Logs the model aliases from the runtime host.
 * 
 * This function retrieves the model aliases stored in the runtime host and
 * logs them using a verbose logging utility. Optionally filters out aliases 
 * that have a source of "default" if specified.
 * 
 * @param options - Optional configuration for logging behavior.
 * @param options.all - If true, includes all aliases regardless of their source.
 */
export function logModelAliases(options?: { all?: boolean }) {
    const { all } = options || {}
    let aliases = Object.entries(runtimeHost.modelAliases)
    if (!all)
        aliases = aliases.filter(([, value]) => value.source !== "default")
    aliases.forEach(([key, value]) =>
        logVerbose(` ${key}: ${value.model} (${value.source})`)
    )
}
