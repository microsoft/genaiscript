import { normalizeFloat, normalizeInt, normalizeVarKey } from "./cleaners"
import type { Project } from "./server/messages"
import { resolveSystems } from "./systems"

function isJSONSchema(obj: any) {
    if (typeof obj === "object" && obj.type === "object") return true
    if (typeof obj === "object" && obj.type === "array") return true
    return false
}

function isPromptParameterTypeRequired(t: PromptParameterType): boolean {
    const ta = t as any
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
        return { type: "string", default: t } satisfies JSONSchemaString
    else if (typeof t === "number")
        return { type: "number", default: t } satisfies JSONSchemaNumber
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
) {
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

export function promptScriptParametersSchema(script: PromptScript) {}

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
        .map((sid) => prj?.scripts?.find((t) => t.id == sid))
        .filter((t) => t?.parameters)) {
        Object.entries(system.parameters).forEach(([k, v]) => {
            parameters[`${system.id}.${k}`] = v
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
                throw new Error(`duplicate parameter ${key} (${nkey})`)
            res[nkey] = res[key]
            delete res[key]
        }
    }
    return Object.freeze(res)
}
