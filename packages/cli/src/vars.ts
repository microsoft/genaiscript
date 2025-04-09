import { CLI_ENV_VAR_RX } from "../../core/src/constants"
import { parseKeyValuePair } from "../../core/src/fence"

/**
 * Parses and combines variables from input and environment variables.
 *
 * @param vars - An array of strings representing key-value pairs to parse.
 * @param env - An object of environment variables with string keys and values.
 * @returns An object containing the merged key-value pairs from `vars` and environment variables whose keys match the regex, with their keys transformed to lowercase.
 */
export function parseOptionsVars(
    vars: string[],
    env: Record<string, string>
): Record<string, string> {
    const vals =
        vars?.reduce((acc, v) => ({ ...acc, ...parseKeyValuePair(v) }), {}) ??
        {}
    const envVals = Object.keys(env)
        .filter((k) => CLI_ENV_VAR_RX.test(k))
        .map((k) => ({
            [k.replace(CLI_ENV_VAR_RX, "").toLocaleLowerCase()]: env[k],
        }))
        .reduce((acc, v) => ({ ...acc, ...v }), {})

    return { ...vals, ...envVals }
}
