"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultModelConfigurations = defaultModelConfigurations;
const constants_js_1 = require("./constants.js");
const llmsdata_js_1 = __importDefault(require("./llmsdata.js"));
const cleaners_js_1 = require("./cleaners.js");
const es_toolkit_1 = require("es-toolkit");
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
function defaultModelConfigurations() {
    const aliases = collectAliases([
        constants_js_1.LARGE_MODEL_ID,
        constants_js_1.SMALL_MODEL_ID,
        constants_js_1.VISION_MODEL_ID,
        "vision_small",
        "embeddings",
        "reasoning",
        "reasoning_small",
    ]);
    const res = {
        ...Object.fromEntries(aliases.map((alias) => [alias, readModelAlias(alias)])),
        ...Object.fromEntries(Object.entries(llmsdata_js_1.default.aliases).map(([id, model]) => [
            id,
            { model, source: "default" },
        ])),
    };
    return structuredClone(res);
    function collectAliases(ids) {
        const candidates = Object.values(llmsdata_js_1.default.providers).flatMap(({ aliases }) => Object.keys(aliases || {}));
        return (0, es_toolkit_1.uniq)([...ids, ...candidates]);
    }
    function readModelAlias(alias) {
        const candidates = Object.values(llmsdata_js_1.default.providers)
            .map(({ id, aliases }) => {
            const ref = aliases?.[alias];
            return ref ? `${id}:${ref}` : undefined;
        })
            .filter((c) => !!c);
        return (0, cleaners_js_1.deleteEmptyValues)({
            model: candidates[0],
            candidates,
            source: "default",
        });
    }
}
//# sourceMappingURL=llms.js.map