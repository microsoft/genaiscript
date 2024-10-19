import { CLI_ENV_VAR_RX } from "../../core/src/constants"
import { parseKeyValuePair } from "../../core/src/fence"

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
