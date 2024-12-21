import { LARGE_MODEL_ID, SMALL_MODEL_ID, VISION_MODEL_ID } from "./constants"
import { ModelConfiguration, ModelConfigurations } from "./host"
import LLMS from "./llms.json"
import { deleteEmptyValues } from "./util"

export function defaultModelConfigurations(): ModelConfigurations {
    const aliases = [
        LARGE_MODEL_ID,
        SMALL_MODEL_ID,
        VISION_MODEL_ID,
        "embeddings",
        "reasoning",
        "reasoning_small",
    ]
    const res = {
        ...(Object.fromEntries(
            aliases.map((alias) => [alias, readModelAlias(alias)])
        ) as ModelConfigurations),
    }
    return structuredClone(res)

    function readModelAlias(alias: string) {
        const candidates = Object.values(LLMS.providers)
            .map(({ id, aliases }) => {
                const ref = (aliases as Record<string, string>)?.[alias]
                return ref ? `${id}:${ref}` : undefined
            })
            .filter((c) => !!c)
        return deleteEmptyValues({
            model: candidates[0],
            candidates,
            source: "default",
        })
    }
}
