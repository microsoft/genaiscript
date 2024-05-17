import { Project } from "./ast"
import { NotSupportedError } from "./error"
import { resolveSystems } from "./expander"

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

export function promptParametersSchemaToJSONSchema(
    parameters: PromptParametersSchema
) {
    if (!parameters) return undefined

    const res: JSONSchemaObject = {
        type: "object",
        properties: {},
        required: [],
    }
    for (const [k, v] of Object.entries(parameters)) {
        const t = promptParameterTypeToJSONSchema(v)
        res.properties[k] = t
        if (t.default !== undefined && t.default !== null) res.required.push(k)
    }
    return res
}

export function parsePromptParameters(
    prj: Project,
    script: PromptScript,
    optionsVars: Record<string, string>
): PromptParameters {
    const res: PromptParameters = {}

    // create the mega parameter structure
    const parameters: PromptParameters = {
        ...(script.parameters || {}),
    }
    for (const system of resolveSystems(prj, script)
        .map((s) => prj.getTemplate(s))
        .filter((t) => t?.parameters)) {
        Object.entries(system.parameters).forEach(([k, v]) => {
            parameters[`${system.id}.${k}`] = v
        })
    }

    // apply defaults
    for (const key in parameters || {}) {
        const t = promptParameterTypeToJSONSchema(parameters[key])
        if (t.default !== undefined) res[key] = t.default
    }

    const vars = {
        ...(script.vars || {}),
        ...(optionsVars || {}),
    }
    // override with user parameters
    for (const key in vars) {
        const p = parameters[key]
        if (!p) res[key] = vars[key]

        const t = promptParameterTypeToJSONSchema(p)
        if (t?.type === "number") res[key] = parseFloat(vars[key])
        else if (t?.type === "integer") res[key] = parseInt(vars[key])
        else if (t?.type === "boolean")
            res[key] = /^\s*(yes|true|ok)\s*$/i.test(vars[key])
        else if (t?.type === "string") res[key] = vars[key]
    }
    return Object.freeze(res)
}
