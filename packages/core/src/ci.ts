import _ci from "ci-info"
import { GENAISCRIPT_DISABLE_GITHUB_ACTIONS_MODE } from "./constants"

export const ci = _ci

/**
 * Check if running in a CI environment, respecting the disable flag.
 * Can be disabled by setting GENAISCRIPT_DISABLE_GITHUB_ACTIONS_MODE=true
 * This is a getter function to allow runtime evaluation of the environment variable.
 */
export function getIsCI(): boolean {
    return process.env[GENAISCRIPT_DISABLE_GITHUB_ACTIONS_MODE] === "true"
        ? false
        : _ci.isCI
}

/**
 * @deprecated Use getIsCI() instead for runtime evaluation
 */
export const isCI = getIsCI()
