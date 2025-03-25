import { resolveScript } from "./ast"
import { resolveSystems } from "./systems"
import { logError } from "./util"
import { YAMLStringify } from "./yaml"
import { Project } from "./server/messages"
import {
    promptParametersSchemaToJSONSchema,
    promptParameterTypeToJSONSchema,
} from "./parameters"
import { normalizeFloat, normalizeInt, normalizeVarKey } from "./cleaners"

/**
 * Resolves the parameters schema for a given script within a project.
 * 
 * This function creates a JSON schema object that describes the parameters 
 * required by the script and its associated systems. It first converts the 
 * script parameters into a JSON schema format and then iterates through all 
 * related systems to include their parameters in the resulting schema.
 * 
 * @param prj - The project context in which the script is defined.
 * @param script - The script for which parameters schema is being resolved.
 * 
 * @returns A JSON schema object representing the parameters of the script 
 * and its associated systems.
 */
export function resolveScriptParametersSchema(
    prj: Project,
    script: PromptScript
): JSONSchemaObject {
    const res: JSONSchemaObject = {
        type: "object",
        properties: {},
    }
    const schema = promptParametersSchemaToJSONSchema(script.parameters)
    res.properties["script"] = schema
    for (const system of resolveSystems(prj, script)
        .map((s) => resolveScript(prj, s))
        .filter((t) => t?.parameters)) {
        Object.entries(system.parameters).forEach(([k, v]) => {
            res.properties[system.id] = promptParametersSchemaToJSONSchema(
                system.parameters
            )
        })
    }
    return res
}

/**
 * Generates a variable name for a system parameter.
 *
 * This function concatenates the system's identifier with the parameter name,
 * creating a unique variable name that reflects the system's context.
 *
 * @param system - The system instance from which to derive the identifier.
 * @param name - The name of the parameter to be included in the variable name.
 * @returns The constructed variable name as a string.
 */
export function systemParameterToVarName(
    system: SystemPromptInstance,
    name: string
) {
    return `${system.id}.${name}`
}

/**
 * Parses prompt parameters from a project and script, combining user-defined variables with default values
 * and system parameters. This function constructs a final set of parameters that are normalized and 
 * resolved, ensuring that all keys are in lowercase. 
 *
 * @param prj - The project context from which systems and scripts are resolved.
 * @param script - The script containing parameter definitions and user variables.
 * @param optionsVars - A record of additional user-provided variables to override defaults.
 * @returns A frozen object containing the resolved prompt parameters.
 */
export function parsePromptParameters(
    prj: Project,
    script: PromptScript,
    optionsVars: Record<string, string | number | boolean | object>
): PromptParameters {
    const res: PromptParameters = {}

    // create the mega parameter structure
    const parameters: PromptParameters = {
        ...(script.parameters || {}),
    }
    for (const system of resolveSystems(prj, script)
        .map((s) => resolveScript(prj, s))
        .filter((t) => t?.parameters)) {
        Object.entries(system.parameters).forEach(([k, v]) => {
            parameters[systemParameterToVarName(system, k)] = v
        })
    }

    // apply defaults
    for (const key in parameters || {}) {
        const p = parameters[key] as any
        if (p.default !== undefined) res[key] = structuredClone(p.default)
        else {
            const t = promptParameterTypeToJSONSchema(p)
            if (t.default !== undefined) res[key] = structuredClone(t.default)
        }
    }

    const vars = {
        ...(script.vars || {}),
        ...(optionsVars || {}),
    }
    // override with user parameters
    for (const key in vars) {
        const p = parameters[key]
        if (!p) {
            res[key] = vars[key]
            continue
        }

        const t = promptParameterTypeToJSONSchema(p)
        if (t?.type === "number") res[key] = normalizeFloat(vars[key])
        else if (t?.type === "integer") res[key] = normalizeInt(vars[key])
        else if (t?.type === "boolean")
            res[key] = /^\s*(y|yes|true|ok)\s*$/i.test(vars[key] + "")
        else if (t?.type === "string") res[key] = vars[key]
    }

    // clone res to all lower case
    for (const key of Object.keys(res)) {
        const nkey = normalizeVarKey(key)
        if (nkey !== key) {
            if (res[nkey] !== undefined)
                logError(`duplicate parameter ${key} (${nkey})`)
            res[nkey] = res[key]
            delete res[key]
        }
    }
    return Object.freeze(res)
}

/**
 * Creates a proxy object for environment variables to enable
 * normalized access and manipulation. The proxy intercepts
 * property accesses, allowing for case-insensitive retrieval
 * of parameters by normalizing their keys.
 * 
 * @param res - The initial set of prompt parameters to be proxified.
 * @returns A proxy that wraps the provided parameters, allowing
 *          access through normalized variable keys.
 * 
 * The proxy includes custom behavior for retrieving property values,
 * handling the `toString` function, and managing property descriptors.
 */
export function proxifyEnvVars(res: PromptParameters) {
    const varsProxy: PromptParameters = new Proxy(
        Object.fromEntries(
            Object.entries(res).map(([k, v]) => [normalizeVarKey(k), v])
        ),
        {
            get(target: PromptParameters, prop: string) {
                if ((prop as any) === Object.prototype.toString)
                    return YAMLStringify(
                        Object.fromEntries(
                            Object.entries(res).map(([k, v]) => [
                                normalizeVarKey(k),
                                v,
                            ])
                        )
                    )
                if (typeof prop === "string")
                    return target[normalizeVarKey(prop)]
                return undefined
            },
            ownKeys(target: PromptParameters) {
                return Reflect.ownKeys(target).map((k) =>
                    normalizeVarKey(k as string)
                )
            },
            getOwnPropertyDescriptor(target: PromptParameters, prop: string) {
                const normalizedKey = normalizeVarKey(prop)
                const value = target[normalizedKey]
                if (value !== undefined) {
                    return {
                        enumerable: true,
                        configurable: true,
                        writable: false,
                        value,
                    }
                }
                return undefined
            },
        }
    )
    return varsProxy
}

/**
 * Merges environment variables with parameters and variables from a system prompt instance.
 * If the system does not have parameters or variables, it returns the original environment variables.
 * Constructs a new variables object by combining existing environment variables, system parameters, 
 * and any additional variables associated with the system.
 *
 * @param ev - The current expansion variables to be merged.
 * @param system - The system prompt instance containing parameters and variables to merge.
 * @returns A new expansion variables object that includes merged variables.
 */
export function mergeEnvVarsWithSystem(
    ev: ExpansionVariables,
    system: SystemPromptInstance
): ExpansionVariables {
    const { parameters, vars } = system
    if (!parameters && !vars) return ev

    const { vars: envVars, ...rest } = ev
    const parameterVars = Object.fromEntries(
        Object.entries(parameters || {}).map(([k, v]) => [
            systemParameterToVarName(system, k),
            v,
        ])
    )
    const newVars = { ...envVars, ...parameterVars, ...(vars || {}) }

    return { vars: newVars, ...rest }
}

/**
 * Converts a collection of prompt parameters into an array of strings.
 * Each string is formatted as "key=value", representing the parameter name and its corresponding value.
 * If no parameters are provided, undefined is returned.
 *
 * @param parameters - The prompt parameters to be converted.
 * @returns An array of strings formatted as "key=value" or undefined if no parameters are supplied.
 */
export function parametersToVars(parameters: PromptParameters): string[] {
    if (!parameters) return undefined
    return Object.keys(parameters).map((k) => `${k}=${parameters[k]}`)
}
