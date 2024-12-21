import { zodToJsonSchema as _zodToJsonSchema } from "zod-to-json-schema"
import { ZodType } from "zod"

/**
 * Converts a Zod schema to a JSON schema
 * @param z
 * @param options
 * @returns
 */
export function tryZodToJsonSchema(z: object, options?: object): JSONSchema {
    if (!z) return undefined
    // instanceof not working, test for some existing methoid
    if (!(z as ZodType)._def) return undefined
    try {
        const definitions = _zodToJsonSchema(z as ZodType, {
            name: "schema",
            target: "openAi",
            ...(options || {}),
        }).definitions
        const keys = Object.keys(definitions)
        const schema = definitions[keys[0]]
        return structuredClone(schema) as JSONSchema
    } catch (e) {
        return undefined
    }
}
