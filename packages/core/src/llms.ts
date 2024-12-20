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
        ...Object.fromEntries(
            Object.entries(LLMS.aliases).map((kv) => [
                kv[0],
                {
                    model: kv[1],
                    source: "default",
                } satisfies ModelConfiguration,
            ])
        ),
    }
    return structuredClone(res)

    function readModelAlias(alias: string) {
        const candidates = Object.values(LLMS.providers)
            .map(({ aliases }) => (aliases as Record<string, string>)?.[alias])
            .filter((c) => !!c)
        return deleteEmptyValues({
            model: candidates[0],
            source: "default",
            candidates,
        })
    }
}
