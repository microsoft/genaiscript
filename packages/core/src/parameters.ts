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

export function promptParameterTypeToJSONSchema(
    t: PromptParameterType | [PromptParameterType]
):
    | JSONSchemaNumber
    | JSONSchemaString
    | JSONSchemaBoolean
    | JSONSchemaObject
    | JSONSchemaArray {
    if (typeof t === "string")
        return deleteUndefinedValues({
            type: "string",
            default: t === "" ? undefined : t,
        }) satisfies JSONSchemaString
    else if (typeof t === "number")
        return deleteUndefinedValues({ type: "number", default: isNaN(t) ? undefined : t }) satisfies JSONSchemaNumber
    else if (typeof t === "boolean")
        return { type: "boolean", default: t } satisfies JSONSchemaBoolean
    else if (Array.isArray(t))
        return {
            type: "array",
            items: promptParameterTypeToJSONSchema(t[0]),
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
                    promptParameterTypeToJSONSchema(v),
                ])
            ),
            required: Object.entries(t)
                .filter(([, v]) => isPromptParameterTypeRequired(v))
                .map(([k]) => k),
        } satisfies JSONSchemaObject
        return o
    } else throw new Error(`prompt type ${typeof t} not supported`)
}

export function promptParametersSchemaToJSONSchema(
    parameters: PromptParametersSchema | JSONSchema | undefined
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
        const t = promptParameterTypeToJSONSchema(v)
        const required = isPromptParameterTypeRequired(v)
        res.properties[k] = t
        if (t.type !== "object" && t.type !== "array" && required)
            res.required.push(k)
    }
    return res satisfies JSONSchemaObject
}
