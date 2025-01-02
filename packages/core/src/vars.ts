import { resolveScript } from "./ast"
import { resolveSystems } from "./systems"
import { logError, normalizeFloat, normalizeInt } from "./util"
import { YAMLStringify } from "./yaml"
import { Project } from "./server/messages"
import { promptParameterTypeToJSONSchema } from "./parameters"

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
                logError(`duplicate parameter ${key} (${nkey})`)
            res[nkey] = res[key]
            delete res[key]
        }
    }
    return Object.freeze(res)
}

export function proxifyVars(res: PromptParameters) {
    const varsProxy: PromptParameters = new Proxy(res, {
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
            return typeof prop === "string"
                ? target[normalizeVarKey(prop)]
                : undefined
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
                    configurable: false,
                    writable: false,
                    value,
                }
            }
            return undefined
        },
    })
    return varsProxy
}

function normalizeVarKey(key: string) {
    return key.toLowerCase().replace(/[^a-z0-9\.]/g, "")
}

export function parametersToVars(parameters: PromptParameters): string[] {
    if (!parameters) return undefined
    return Object.keys(parameters).map((k) => `${k}=${parameters[k]}`)
}
