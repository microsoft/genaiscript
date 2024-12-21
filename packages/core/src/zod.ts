import { zodToJsonSchema as _zodToJsonSchema } from "zod-to-json-schema"

/**
 * Converts a Zod schema to a JSON schema
 * @param z
 * @param options
 * @returns
 */
export function tryZodToJsonSchema(z: object, options?: object): JSONSchema {
    if (!z) return undefined
    // instanceof not working, test for some existing methoid
    if (!(z as any)._def) return undefined
    try {
        const schema = _zodToJsonSchema(z as any, {
            target: "openAi",
            ...(options || {}),
        })
        return structuredClone(schema) as JSONSchema
    } catch (e) {
        return undefined
    }
}
