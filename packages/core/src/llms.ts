// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { LARGE_MODEL_ID, SMALL_MODEL_ID, VISION_MODEL_ID } from "./constants.js";
import { ModelConfiguration, ModelConfigurations } from "./host.js";
import LLMS from "./llmsdata.js";
import { deleteEmptyValues } from "./cleaners.js";
import { uniq } from "es-toolkit";

/**
 * Generates default model configurations by aggregating model aliases and
 * merging them with pre-defined mappings from LLM configurations.
 *
 * @returns The aggregated and structured clone of model configurations.
 *
 * @param collectAliases
 *   Helper function that collects unique model aliases based on predetermined IDs
 *   and candidate aliases defined in the LLM providers.
 *   - ids: An array of strings representing predefined model identifiers.
 *
 * @param readModelAlias
 *   Helper function that reads the configuration for a specific alias.
 *   - alias: A string representing the alias to fetch the model details for.
 *
 * Function behavior:
 * - Creates a mapping of aliases to their corresponding model configurations
 *   by merging collected aliases with provider-defined ones.
 * - Ensures all resulting configurations are free of empty values.
 * - Returns a structured clone of the final configurations object.
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
  ]);
  const res = {
    ...(Object.fromEntries(
      aliases.map<[string, ModelConfiguration]>((alias) => [alias, readModelAlias(alias)]),
    ) as ModelConfigurations),
    ...Object.fromEntries(
      Object.entries(LLMS.aliases).map<[string, ModelConfiguration]>(([id, model]) => [
        id,
        { model, source: "default" } satisfies ModelConfiguration,
      ]),
    ),
  };
  return structuredClone(res);

  function collectAliases(ids: string[]): string[] {
    const candidates = Object.values(LLMS.providers).flatMap(({ aliases }) =>
      Object.keys(aliases || {}),
    );
    return uniq([...ids, ...candidates]);
  }
  function readModelAlias(alias: string) {
    const candidates = Object.values(LLMS.providers)
      .map(({ id, aliases }) => {
        const ref = (aliases as Record<string, string>)?.[alias];
        return ref ? `${id}:${ref}` : undefined;
      })
      .filter((c) => !!c);
    return deleteEmptyValues({
      model: candidates[0],
      candidates,
      source: "default",
    } satisfies ModelConfiguration);
  }
}
