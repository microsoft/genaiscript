import { zodToJsonSchema as _zodToJsonSchema } from "zod-to-json-schema"

/**
 * Converts a Zod schema to a JSON schema
 * @param z
 * @param options
 * @returns
 */
export function tryZodToJsonSchema(
    z: ZodTypeLike,
    options?: object
): JSONSchema {
    if (!z || !z._def || !z.refine || !z.safeParse) return undefined
    const schema = _zodToJsonSchema(z as any, {
        target: "openAi",
        ...(options || {}),
    })
    return structuredClone(schema) as JSONSchema
}
