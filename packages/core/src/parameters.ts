import { NotSupportedError } from "./error"

export function promptParameterTypeToJSONSchema(
    t: PromptParameterType
): JSONSchemaNumber | JSONSchemaString | JSONSchemaBoolean {
    if (typeof t === "string")
        return <JSONSchemaString>{ type: "string", default: t }
    else if (typeof t === "number")
        return <JSONSchemaNumber>{ type: "number", default: t }
    else if (typeof t === "boolean")
        return <JSONSchemaBoolean>{ type: "boolean", default: t }
    else if (typeof t === "object" && !!(t as any).type)
        return t // TODO better filtering
    else throw new NotSupportedError(`prompt type ${typeof t} not supported`)
}

export function parsePromptParameters(
    parameters: PromptParametersSchema,
    vars: Record<string, string>
): PromptParameters {
    const res: PromptParameters = {}

    // apply defaults
    for (const key in parameters || {}) {
        const t = promptParameterTypeToJSONSchema(parameters[key])
        if (t.default !== undefined) res[key] = t.default
    }

    // override with user parameters
    for (const key in vars || {}) {
        const p = parameters[key]
        if (!p) res[key] = vars[key]
        const t = promptParameterTypeToJSONSchema(p)
        if (t?.type === "number") res[key] = parseFloat(vars[key])
        else if (t?.type === "integer") res[key] = parseInt(vars[key])
        else if (t?.type === "boolean")
            res[key] = /^\s*(yes|true|ok)\s*$/i.test(vars[key])
        else res[key] = vars[key]
    }
    return Object.freeze(res)
}
