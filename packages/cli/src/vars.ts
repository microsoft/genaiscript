import { CLI_ENV_VAR_RX } from "../../core/src/constants";
import { genaiscriptDebug } from "../../core/src/debug";
import { parseKeyValuePair } from "../../core/src/fence";
import { camelCase } from "es-toolkit";
const dbg = genaiscriptDebug("cli:vars");

/**
 * Parses and combines variables from input and environment variables.
 *
 * @param vars - An array of strings representing key-value pairs to parse.
 * @param env - An object of environment variables with string keys and values.
 * @returns An object containing the merged key-value pairs from `vars` and environment variables whose keys match the regex, with their keys transformed to lowercase.
 */
export function parseOptionsVars(
  vars: string[] | Record<string, string | number | boolean | object>,
  env: Record<string, string>,
): Record<string, string> {
  const vals = Array.isArray(vars)
    ? vars.reduce((acc, v) => ({ ...acc, ...parseKeyValuePair(v) }), {})
    : ((vars || {}) as Record<string, any>);
  dbg(`cli %O`, Object.keys(vals));
  const envVals = Object.keys(env)
    .filter((k) => CLI_ENV_VAR_RX.test(k))
    .map((k) => ({
      [camelCase(k.replace(CLI_ENV_VAR_RX, ""))]: env[k],
    }))
    .reduce((acc, v) => ({ ...acc, ...v }), {});
  dbg(`env %O`, Object.keys(envVals));
  return { ...vals, ...envVals };
}
