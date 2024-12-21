import { MODEL_PROVIDERS } from "../../core/src/constants"
import { parseKeyValuePair } from "../../core/src/fence"
import { runtimeHost } from "../../core/src/host"
import { logVerbose } from "../../core/src/util"
import { PromptScriptRunOptions } from "./main"

export function applyModelOptions(
    options: Partial<
        Pick<
            PromptScriptRunOptions,
            "model" | "smallModel" | "visionModel" | "modelAlias" | "provider"
        >
    >
) {
    if (options.provider) {
        const provider = MODEL_PROVIDERS.find((p) => p.id === options.provider)
        if (!provider)
            throw new Error(`Model provider not found: ${options.provider}`)
        for (const [key, value] of Object.entries(provider.aliases || {}))
            runtimeHost.setModelAlias("cli", key, provider.id + ":" + value)
    }
    if (options.model) runtimeHost.setModelAlias("cli", "large", options.model)
    if (options.smallModel)
        runtimeHost.setModelAlias("cli", "small", options.smallModel)
    if (options.visionModel)
        runtimeHost.setModelAlias("cli", "vision", options.visionModel)
    for (const kv of options.modelAlias || []) {
        const aliases = parseKeyValuePair(kv)
        for (const [key, value] of Object.entries(aliases))
            runtimeHost.setModelAlias("cli", key, value)
    }

    const modelAlias = runtimeHost.modelAliases
    if (Object.values(modelAlias).some((m) => m.source !== "default"))
        Object.entries(runtimeHost.modelAliases).forEach(([key, value]) =>
            logVerbose(` ${key}: ${value.model} (${value.source})`)
        )
}
