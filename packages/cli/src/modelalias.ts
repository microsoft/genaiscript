import { MODEL_PROVIDERS } from "../../core/src/constants"
import { parseKeyValuePair } from "../../core/src/fence"
import { runtimeHost } from "../../core/src/host"
import { logVerbose } from "../../core/src/util"
import { PromptScriptRunOptions } from "./main"

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

export function logModelAliases() {
    const modelAlias = runtimeHost.modelAliases
    if (Object.values(modelAlias).some((m) => m.source !== "default"))
        Object.entries(runtimeHost.modelAliases)
            .filter(([, value]) => value.source !== "default")
            .forEach(([key, value]) =>
                logVerbose(` ${key}: ${value.model} (${value.source})`)
            )
}
