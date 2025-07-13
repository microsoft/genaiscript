import { Project } from "./server/messages.js";
import type { ExpansionVariables, JSONSchemaObject, PromptParameters, PromptScript, SystemPromptInstance } from "./types.js";
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
export declare function resolveScriptParametersSchema(prj: Project, script: PromptScript): JSONSchemaObject;
/**
 * Constructs a variable name for a system parameter by combining the system's unique identifier
 * with the parameter name.
 *
 * @param system - The system instance to which the parameter belongs.
 * @param name - The name of the parameter to be converted into a variable name.
 * @returns A string representing the parameter's variable name in the format "systemId.parameterName".
 */
export declare function systemParameterToVarName(system: SystemPromptInstance, name: string): string;
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
export declare function parsePromptParameters(prj: Project, script: PromptScript, optionsVars: Record<string, string | number | boolean | object>): PromptParameters;
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
export declare function proxifyEnvVars(res: PromptParameters): PromptParameters;
/**
 * Merges existing environment variables with parameters and variables from a system instance.
 *
 * @param ev - The current environment variables, including `vars` and any additional properties.
 * @param system - The system instance containing `parameters` and `vars` to merge.
 * @returns A new object with `vars` containing merged environment variables, system parameters, and system variables, along with the rest of the `ev` properties.
 */
export declare function mergeEnvVarsWithSystem(ev: ExpansionVariables, system: SystemPromptInstance): ExpansionVariables;
/**
 * Converts a set of parameters into an array of strings in the format "key=value".
 *
 * @param parameters - An object containing key-value pairs representing the parameters.
 *                     Keys represent parameter names and values represent their corresponding values.
 * @returns An array of strings where each string represents a parameter as "key=value".
 *          Returns undefined if the input is not provided.
 */
export declare function parametersToVars(parameters: PromptParameters): string[];
/**
 * Parses and combines variables from input and environment variables.
 *
 * @param vars - An array of strings representing key-value pairs to parse.
 * @param env - An object of environment variables with string keys and values.
 * @returns An object containing the merged key-value pairs from `vars` and environment variables whose keys match the regex, with their keys transformed to lowercase.
 */
export declare function parseOptionsVars(vars: string[] | Record<string, string | number | boolean | object>, env: Record<string, string>): Record<string, string>;
//# sourceMappingURL=vars.d.ts.map