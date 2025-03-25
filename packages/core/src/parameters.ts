import { deleteUndefinedValues } from "./cleaners"

function isJSONSchema(obj: any) {
    if (typeof obj === "object" && obj.type === "object") return true
    if (typeof obj === "object" && obj.type === "array") return true
    return false
}

function isPromptParameterTypeRequired(t: PromptParameterType): boolean {
    const ta = t as any
    if (typeof t === "string" && t === "") return true
    if (typeof t === "number" && isNaN(t)) return true
    return !!ta?.required
}

export interface PromptParametersSchemaConversionOptions {
    noDefaults?: boolean
}

/**
 * Converts a given prompt parameter type into its corresponding JSON Schema representation.
 *
 * @param t - The prompt parameter type or an array containing a single prompt parameter type.
 * @param options - Optional conversion options. Contains a flag to skip default values in schema generation.
 * @returns A JSON Schema representation of the provided prompt parameter type. Supports string, number, boolean, object, and array types.
 * @throws Will throw an error if the input type is not supported.
 */
export function promptParameterTypeToJSONSchema(
    t: PromptParameterType | [PromptParameterType],
    options?: PromptParametersSchemaConversionOptions
):
    | JSONSchemaNumber
    | JSONSchemaString
    | JSONSchemaBoolean
    | JSONSchemaObject
    | JSONSchemaArray {
    const { noDefaults } = options || {}
    if (typeof t === "string")
        return deleteUndefinedValues({
            type: "string",
            default: noDefaults || t === "" ? undefined : t,
        }) satisfies JSONSchemaString
    else if (typeof t === "number")
        return deleteUndefinedValues({
            type: Number.isInteger(t) ? "integer" : "number",
            default: noDefaults || isNaN(t) ? undefined : t,
        }) satisfies JSONSchemaNumber
    else if (typeof t === "boolean")
        return deleteUndefinedValues({
            type: "boolean",
            default: noDefaults ? undefined : t,
        }) satisfies JSONSchemaBoolean
    else if (Array.isArray(t))
        return {
            type: "array",
            items: promptParameterTypeToJSONSchema(t[0], options),
        } satisfies JSONSchemaArray
    else if (
        typeof t === "object" &&
        ["number", "integer", "string", "boolean", "object"].includes(
            (t as any).type
        )
    ) {
        const { required, ...rest } = t as any
        return <
            | JSONSchemaNumber
            | JSONSchemaString
            | JSONSchemaBoolean
            | JSONSchemaObject
        >{ ...rest }
    } else if (typeof t === "object") {
        const o = {
            type: "object",
            properties: Object.fromEntries(
                Object.entries(t).map(([k, v]) => [
                    k,
                    promptParameterTypeToJSONSchema(v, options),
                ])
            ),
            required: Object.entries(t)
                .filter(([, v]) => isPromptParameterTypeRequired(v))
                .map(([k]) => k),
        } satisfies JSONSchemaObject
        return o
    } else throw new Error(`prompt type ${typeof t} not supported`)
}

/**
 * Converts a PromptParametersSchema or JSONSchema into JSONSchema format.
 * 
 * @param parameters - The parameters schema to be converted. Can be a PromptParametersSchema, a JSONSchema, or undefined. If undefined, returns undefined.
 * @param options - Optional conversion options which may include whether to exclude default values.
 * @returns A JSONSchema object or undefined if the input parameters are undefined.
 */
export function promptParametersSchemaToJSONSchema(
    parameters: PromptParametersSchema | JSONSchema | undefined,
    options?: PromptParametersSchemaConversionOptions
): JSONSchema | undefined {
    if (!parameters) return undefined
    if (isJSONSchema(parameters)) return parameters as JSONSchema

    const res: Required<
        Pick<JSONSchemaObject, "type" | "properties" | "required">
    > = {
        type: "object",
        properties: {},
        required: [],
    }

    for (const [k, v] of Object.entries(parameters as PromptParametersSchema)) {
        const t = promptParameterTypeToJSONSchema(v, options)
        const required = isPromptParameterTypeRequired(v)
        res.properties[k] = t
        if (t.type !== "object" && t.type !== "array" && required)
            res.required.push(k)
    }
    return res satisfies JSONSchemaObject
}
