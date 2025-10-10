import _ci from "ci-info"
import { GENAISCRIPT_DISABLE_GITHUB_ACTIONS_MODE } from "./constants"

export const ci = _ci

/**
 * Check if running in a CI environment, respecting the disable flag.
 * Can be disabled by setting GENAISCRIPT_DISABLE_GITHUB_ACTIONS_MODE=true
 */
export const isCI =
    process.env[GENAISCRIPT_DISABLE_GITHUB_ACTIONS_MODE] === "true"
        ? false
        : _ci.isCI
