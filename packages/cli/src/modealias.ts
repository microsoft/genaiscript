import { parseKeyValuePair } from "../../core/src/fence"
import { runtimeHost } from "../../core/src/host"
import { PromptScriptRunOptions } from "./main"

export function applyModelOptions(options: Partial<PromptScriptRunOptions>) {
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
}
