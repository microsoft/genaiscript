"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveScriptParametersSchema = resolveScriptParametersSchema;
exports.systemParameterToVarName = systemParameterToVarName;
exports.parsePromptParameters = parsePromptParameters;
exports.proxifyEnvVars = proxifyEnvVars;
exports.mergeEnvVarsWithSystem = mergeEnvVarsWithSystem;
exports.parametersToVars = parametersToVars;
exports.parseOptionsVars = parseOptionsVars;
const ast_js_1 = require("./ast.js");
const systems_js_1 = require("./systems.js");
const util_js_1 = require("./util.js");
const yaml_js_1 = require("./yaml.js");
const parameters_js_1 = require("./parameters.js");
const cleaners_js_1 = require("./cleaners.js");
const debug_js_1 = require("./debug.js");
const constants_js_1 = require("./constants.js");
const es_toolkit_1 = require("es-toolkit");
const fence_js_1 = require("./fence.js");
const dbg = (0, debug_js_1.genaiscriptDebug)("vars");
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
function resolveScriptParametersSchema(prj, script) {
    const res = {
        type: "object",
        properties: {},
    };
    const schema = (0, parameters_js_1.promptParametersSchemaToJSONSchema)(script.parameters);
    if (schema)
        res.properties["script"] = schema;
    for (const system of (0, systems_js_1.resolveSystems)(prj, script)
        .map((s) => (0, ast_js_1.resolveScript)(prj, s))
        .filter((t) => t?.parameters)) {
        Object.entries(system.parameters).forEach(([k, v]) => {
            res.properties[system.id] = (0, parameters_js_1.promptParametersSchemaToJSONSchema)(system.parameters);
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
function systemParameterToVarName(system, name) {
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
function parsePromptParameters(prj, script, optionsVars) {
    const res = {};
    // create the mega parameter structure
    const parameters = {
        ...(script.parameters || {}),
    };
    for (const system of (0, systems_js_1.resolveSystems)(prj, script)
        .map((s) => (0, ast_js_1.resolveScript)(prj, s))
        .filter((t) => t?.parameters)) {
        Object.entries(system.parameters).forEach(([k, v]) => {
            parameters[systemParameterToVarName(system, k)] = v;
        });
    }
    // apply defaults
    for (const key in parameters || {}) {
        const p = parameters[key];
        if (p.default !== undefined)
            res[key] = structuredClone(p.default);
        else {
            const t = (0, parameters_js_1.promptParameterTypeToJSONSchema)(p);
            if (t.default !== undefined)
                res[key] = structuredClone(t.default);
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
        const t = (0, parameters_js_1.promptParameterTypeToJSONSchema)(p);
        if (t?.type === "number")
            res[key] = (0, cleaners_js_1.normalizeFloat)(vars[key]);
        else if (t?.type === "integer")
            res[key] = (0, cleaners_js_1.normalizeInt)(vars[key]);
        else if (t?.type === "boolean")
            res[key] = /^\s*(y|yes|true|ok)\s*$/i.test(vars[key] + "");
        else if (t?.type === "string")
            res[key] = vars[key];
    }
    // clone res to all lower case
    for (const key of Object.keys(res)) {
        const nkey = (0, cleaners_js_1.normalizeVarKey)(key);
        if (nkey !== key) {
            if (res[nkey] !== undefined)
                (0, util_js_1.logError)(`duplicate parameter ${key} (${nkey})`);
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
function proxifyEnvVars(res) {
    const varsProxy = new Proxy(Object.fromEntries(Object.entries(res).map(([k, v]) => [(0, cleaners_js_1.normalizeVarKey)(k), v])), {
        get(target, prop) {
            if (prop === Object.prototype.toString)
                return (0, yaml_js_1.YAMLStringify)(Object.fromEntries(Object.entries(res).map(([k, v]) => [(0, cleaners_js_1.normalizeVarKey)(k), v])));
            if (typeof prop === "string")
                return target[(0, cleaners_js_1.normalizeVarKey)(prop)];
            return undefined;
        },
        ownKeys(target) {
            return Reflect.ownKeys(target).map((k) => (0, cleaners_js_1.normalizeVarKey)(k));
        },
        getOwnPropertyDescriptor(target, prop) {
            const normalizedKey = (0, cleaners_js_1.normalizeVarKey)(prop);
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
    });
    return varsProxy;
}
/**
 * Merges existing environment variables with parameters and variables from a system instance.
 *
 * @param ev - The current environment variables, including `vars` and any additional properties.
 * @param system - The system instance containing `parameters` and `vars` to merge.
 * @returns A new object with `vars` containing merged environment variables, system parameters, and system variables, along with the rest of the `ev` properties.
 */
function mergeEnvVarsWithSystem(ev, system) {
    const { parameters, vars } = system;
    if (!parameters && !vars) {
        dbgSystem(`%s: no vars`, system.id);
        return ev;
    }
    const { vars: envVars, ...rest } = ev;
    const parameterVars = Object.fromEntries(Object.entries(parameters || {}).map(([k, v]) => [systemParameterToVarName(system, k), v]));
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
function parametersToVars(parameters) {
    if (!parameters)
        return undefined;
    return Object.keys(parameters).map((k) => `${k}=${parameters[k]}`);
}
/**
 * Parses and combines variables from input and environment variables.
 *
 * @param vars - An array of strings representing key-value pairs to parse.
 * @param env - An object of environment variables with string keys and values.
 * @returns An object containing the merged key-value pairs from `vars` and environment variables whose keys match the regex, with their keys transformed to lowercase.
 */
function parseOptionsVars(vars, env) {
    const vals = Array.isArray(vars)
        ? vars.reduce((acc, v) => ({ ...acc, ...(0, fence_js_1.parseKeyValuePair)(v) }), {})
        : (vars || {});
    dbg(`cli %O`, Object.keys(vals));
    const envVals = Object.keys(env)
        .filter((k) => constants_js_1.CLI_ENV_VAR_RX.test(k))
        .map((k) => ({
        [(0, es_toolkit_1.camelCase)(k.replace(constants_js_1.CLI_ENV_VAR_RX, ""))]: env[k],
    }))
        .reduce((acc, v) => ({ ...acc, ...v }), {});
    dbg(`env %O`, Object.keys(envVals));
    return { ...vals, ...envVals };
}
//# sourceMappingURL=vars.js.map