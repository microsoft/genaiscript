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
 * Converts a prompt parameter type or an array of prompt parameter types into a JSON Schema representation.
 * The function supports various types including string, number, boolean, arrays, and objects.
 * 
 * @param t - A prompt parameter type or an array of prompt parameter types to be converted.
 * @param options - Conversion options that may affect the output schema.
 * 
 * @returns A JSON Schema object representing the specified prompt parameter type.
 * 
 * @throws Error if the provided prompt parameter type is not supported.
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
 * Converts a prompt parameters schema or JSON Schema into a JSON Schema representation.
 * 
 * @param parameters - The prompt parameters schema or a JSON Schema to convert. Can be undefined.
 * @param options - Optional settings for the conversion.
 * 
 * @returns A JSON Schema representation of the input parameters, or undefined if no parameters are provided.
 * 
 * The function first checks if the input is already a JSON Schema. If it is, it returns it directly.
 * Otherwise, it initializes an object with type, properties, and required fields. It iterates through 
 * the entries of the parameters, converting each parameter type to its corresponding JSON Schema and 
 * marking required fields based on the parameter definitions. The resulting schema is returned.
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
