import { MODEL_PROVIDERS } from "../../core/src/constants"
import { parseKeyValuePair } from "../../core/src/fence"
import { runtimeHost } from "../../core/src/host"
import { logVerbose } from "../../core/src/util"
import { PromptScriptRunOptions } from "./server/messages"

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

export function applyScriptModelAliases(script: PromptScript) {
    applyModelOptions(script, "script")
    if (script.modelAliases)
        Object.entries(script.modelAliases).forEach(([name, alias]) => {
            runtimeHost.setModelAlias("script", name, alias)
        })
}

export function logModelAliases(options?: { all?: boolean }) {
    const { all } = options || {}
    let aliases = Object.entries(runtimeHost.modelAliases)
    if (!all)
        aliases = aliases.filter(([, value]) => value.source !== "default")
    aliases.forEach(([key, value]) =>
        logVerbose(` ${key}: ${value.model} (${value.source})`)
    )
}
