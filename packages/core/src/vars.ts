import { resolveScript } from "./ast";
import { resolveSystems } from "./systems";
import { logError } from "./util";
import { YAMLStringify } from "./yaml";
import { Project } from "./server/messages";
import { promptParametersSchemaToJSONSchema, promptParameterTypeToJSONSchema } from "./parameters";
import { normalizeFloat, normalizeInt, normalizeVarKey } from "./cleaners";
import { genaiscriptDebug } from "./debug";
const dbg = genaiscriptDebug("vars");
const dbgSchema = dbg.extend("schema");
const dbgSystem = dbg.extend("system");
dbgSchema.enabled = false;

/**
 * Resolves and generates a JSON schema object representing the parameters schema
 * for a given script and its associated systems in the project.
 *
 * @param prj - The project context containing scripts and systems.
 * @param script - The script for which the parameters schema is to be resolved.
 * @returns A JSON schema object describing the structure of the parameters
 *          for the script and its associated systems. The schema includes properties
 *          for the script itself and for each system associated with the script.
 */
export function resolveScriptParametersSchema(
  prj: Project,
  script: PromptScript,
): JSONSchemaObject {
  const res: JSONSchemaObject = {
    type: "object",
    properties: {},
  };
  const schema = promptParametersSchemaToJSONSchema(script.parameters);
  if (schema) res.properties["script"] = schema;
  for (const system of resolveSystems(prj, script)
    .map((s) => resolveScript(prj, s))
    .filter((t) => t?.parameters)) {
    Object.entries(system.parameters).forEach(([k, v]) => {
      res.properties[system.id] = promptParametersSchemaToJSONSchema(system.parameters);
    });
  }
  dbgSchema(`%s: %O`, script.id, res.properties);
  return res;
}

/**
 * Constructs a variable name for a system parameter by combining the system's unique identifier
 * with the parameter name.
 *
 * @param system - The system instance to which the parameter belongs.
 * @param name - The name of the parameter to be converted into a variable name.
 * @returns A string representing the parameter's variable name in the format "systemId.parameterName".
 */
export function systemParameterToVarName(system: SystemPromptInstance, name: string) {
  return `${system.id}.${name}`;
}

/**
 * Parses and resolves prompt parameters for the provided project and script,
 * applying defaults, normalizing keys, and incorporating user-supplied variables.
 *
 * - Creates a combined parameter structure from the script and its associated systems.
 * - Applies default values from the parameter definitions or their JSON schema.
 * - Overrides defaults with user-supplied variables.
 * - Normalizes parameter keys to a consistent format.
 * - Logs errors for duplicate normalized keys.
 *
 * @param prj - The project instance used to resolve systems and scripts.
 * @param script - The prompt script containing the initial parameters and variables.
 * @param optionsVars - Additional variables provided by the user to override or extend script parameters.
 *
 * @returns A frozen object containing the resolved and normalized prompt parameters.
 */
export function parsePromptParameters(
  prj: Project,
  script: PromptScript,
  optionsVars: Record<string, string | number | boolean | object>,
): PromptParameters {
  const res: PromptParameters = {};

  // create the mega parameter structure
  const parameters: PromptParameters = {
    ...(script.parameters || {}),
  };
  for (const system of resolveSystems(prj, script)
    .map((s) => resolveScript(prj, s))
    .filter((t) => t?.parameters)) {
    Object.entries(system.parameters).forEach(([k, v]) => {
      parameters[systemParameterToVarName(system, k)] = v;
    });
  }

  // apply defaults
  for (const key in parameters || {}) {
    const p = parameters[key] as any;
    if (p.default !== undefined) res[key] = structuredClone(p.default);
    else {
      const t = promptParameterTypeToJSONSchema(p);
      if (t.default !== undefined) res[key] = structuredClone(t.default);
    }
  }

  const vars = {
    ...(script.vars || {}),
    ...(optionsVars || {}),
  };
  // override with user parameters
  for (const key in vars) {
    const p = parameters[key];
    if (!p) {
      res[key] = vars[key];
      continue;
    }

    const t = promptParameterTypeToJSONSchema(p);
    if (t?.type === "number") res[key] = normalizeFloat(vars[key]);
    else if (t?.type === "integer") res[key] = normalizeInt(vars[key]);
    else if (t?.type === "boolean") res[key] = /^\s*(y|yes|true|ok)\s*$/i.test(vars[key] + "");
    else if (t?.type === "string") res[key] = vars[key];
  }

  // clone res to all lower case
  for (const key of Object.keys(res)) {
    const nkey = normalizeVarKey(key);
    if (nkey !== key) {
      if (res[nkey] !== undefined) logError(`duplicate parameter ${key} (${nkey})`);
      res[nkey] = res[key];
      delete res[key];
    }
  }

  dbg(`%s: %O`, script.id, res);
  return Object.freeze(res);
}

/**
 * Creates a proxy for environment variables, normalizing keys to a consistent format
 * and providing additional handling for specific operations.
 *
 * @param res - The resolved prompt parameters to proxify.
 * @returns A proxy object that normalizes variable keys and provides access to the parameter values.
 *
 * Object behavior:
 * - Keys are normalized using `normalizeVarKey`.
 * - The proxy supports fetching keys, enumerating own keys, and retrieving property descriptors.
 * - The `Object.prototype.toString` method is overridden to return a YAML stringified version
 *   of the proxify-ed parameters.
 * - The proxy allows access to parameter values using normalized keys.
 */
export function proxifyEnvVars(res: PromptParameters) {
  const varsProxy: PromptParameters = new Proxy(
    Object.fromEntries(Object.entries(res).map(([k, v]) => [normalizeVarKey(k), v])),
    {
      get(target: PromptParameters, prop: string) {
        if ((prop as any) === Object.prototype.toString)
          return YAMLStringify(
            Object.fromEntries(Object.entries(res).map(([k, v]) => [normalizeVarKey(k), v])),
          );
        if (typeof prop === "string") return target[normalizeVarKey(prop)];
        return undefined;
      },
      ownKeys(target: PromptParameters) {
        return Reflect.ownKeys(target).map((k) => normalizeVarKey(k as string));
      },
      getOwnPropertyDescriptor(target: PromptParameters, prop: string) {
        const normalizedKey = normalizeVarKey(prop);
        const value = target[normalizedKey];
        if (value !== undefined) {
          return {
            enumerable: true,
            configurable: true,
            writable: false,
            value,
          };
        }
        return undefined;
      },
    },
  );
  return varsProxy;
}

/**
 * Merges existing environment variables with parameters and variables from a system instance.
 *
 * @param ev - The current environment variables, including `vars` and any additional properties.
 * @param system - The system instance containing `parameters` and `vars` to merge.
 * @returns A new object with `vars` containing merged environment variables, system parameters, and system variables, along with the rest of the `ev` properties.
 */
export function mergeEnvVarsWithSystem(
  ev: ExpansionVariables,
  system: SystemPromptInstance,
): ExpansionVariables {
  const { parameters, vars } = system;
  if (!parameters && !vars) {
    dbgSystem(`%s: no vars`, system.id);
    return ev;
  }

  const { vars: envVars, ...rest } = ev;
  const parameterVars = Object.fromEntries(
    Object.entries(parameters || {}).map(([k, v]) => [systemParameterToVarName(system, k), v]),
  );
  const newVars = { ...envVars, ...parameterVars, ...(vars || {}) };

  const res = { vars: newVars, ...rest };
  dbgSystem(`%s: %O`, system.id, res.vars);
  return res;
}

/**
 * Converts a set of parameters into an array of strings in the format "key=value".
 *
 * @param parameters - An object containing key-value pairs representing the parameters.
 *                     Keys represent parameter names and values represent their corresponding values.
 * @returns An array of strings where each string represents a parameter as "key=value".
 *          Returns undefined if the input is not provided.
 */
export function parametersToVars(parameters: PromptParameters): string[] {
  if (!parameters) return undefined;
  return Object.keys(parameters).map((k) => `${k}=${parameters[k]}`);
}
