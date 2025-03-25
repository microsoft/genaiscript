import debug from "debug"
const dbg = debug("genaiscript:tools")

import { MODEL_PROVIDERS } from "./constants"
import { parseModelIdentifier } from "./models"

/**
 * Escapes a tool name by replacing invalid characters.
 * 
 * The function performs the following transformations:
 * - Replaces any character that is not an alphanumeric character, underscore, or hyphen with an underscore.
 * - Replaces hyphens with underscores.
 * - Collapses consecutive underscores into a single underscore.
 * - Removes trailing underscores from the end of the string.
 * 
 * @param name The tool name to be escaped.
 * @returns The escaped tool name.
 */
export function escapeToolName(name: string) {
    return name
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .replace("-", "_")
        .replace(/_{2,}/g, "_")
        .replace(/_+$/, "")
}

/**
 * Checks if tools are supported for a given model ID.
 * 
 * This function examines the model ID to determine if tools can be used based on the model's provider and family.
 * It returns a boolean indicating support, or undefined if the support status is not explicitly defined.
 * 
 * The function first verifies if the model ID is provided. It then parses the provider and family from the model ID,
 * searching for provider-specific information in the MODEL_PROVIDERS constant. If the provider is found,
 * it checks for tool support settings specific to the model family or provider level.
 * Additionally, it restricts support for certain model families matching specified patterns.
 * 
 * @param modelId The model identifier to check for tool support.
 * @returns A boolean indicating if tools are supported, or undefined if not determined.
 */
export function isToolsSupported(modelId: string): boolean | undefined {
    if (!modelId) {
        return undefined
    }
    const { provider, family } = parseModelIdentifier(modelId)

    dbg(`searching for provider info for provider: ${provider}`)
    const info = MODEL_PROVIDERS.find(({ id }) => provider === id)
    if (info) {
        dbg(`tools support is explicitly disabled for model family: ${family}`)
        const value = info.models?.[family]?.tools
        if (typeof value === "boolean") {
            dbg(`model family ${family} = ${value}`)
            return value
        }
        dbg(`tools support is explicitly disabled for provider: ${provider}`)
        if (info.tools === false) {
            return false
        }
    }

    dbg(`checking if model family matches restricted o1 patterns: ${family}`)
    if (/^o1-(mini|preview)/.test(family)) {
        return false
    }

    dbg(`model family tool support is undefined: ${family}`)
    return undefined
}
