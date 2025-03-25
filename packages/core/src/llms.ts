import { LARGE_MODEL_ID, SMALL_MODEL_ID, VISION_MODEL_ID } from "./constants"
import { ModelConfiguration, ModelConfigurations } from "./host"
import LLMS from "./llms.json"
import { deleteEmptyValues } from "./cleaners"
import { uniq } from "es-toolkit"

/**
 * Generates default model configurations based on predefined model IDs and available aliases.
 * Collects aliases from a list of model IDs and the LLMS providers, then creates a configuration 
 * object containing references to the models. It also includes source information for each model 
 * configuration and eliminates any empty values in the final output.
 * 
 * @returns Default model configurations object.
 */
export function defaultModelConfigurations(): ModelConfigurations {
    const aliases = collectAliases([
        LARGE_MODEL_ID,
        SMALL_MODEL_ID,
        VISION_MODEL_ID,
        "vision_small",
        "embeddings",
        "reasoning",
        "reasoning_small",
    ])
    const res = {
        ...(Object.fromEntries(
            aliases.map<[string, ModelConfiguration]>((alias) => [
                alias,
                readModelAlias(alias),
            ])
        ) as ModelConfigurations),
        ...Object.fromEntries(
            Object.entries(LLMS.aliases).map<[string, ModelConfiguration]>(
                ([id, model]) => [
                    id,
                    { model, source: "default" } satisfies ModelConfiguration,
                ]
            )
        ),
    }
    return structuredClone(res)

    function collectAliases(ids: string[]): string[] {
        const candidates = Object.values(LLMS.providers).flatMap(
            ({ aliases }) => Object.keys(aliases || {})
        )
        return uniq([...ids, ...candidates])
    }
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
        } satisfies ModelConfiguration)
    }
}
