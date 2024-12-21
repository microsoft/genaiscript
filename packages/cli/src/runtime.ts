/**
 * GenAIScript supporting runtime
 */
import { delay as _delay } from "es-toolkit"
import { zodToJsonSchema as _zodToJsonSchema } from "zod-to-json-schema"
import { z as zod } from "zod"

/**
 * A helper function to delay the execution of the script
 */
export const delay: (ms: number) => Promise<void> = _delay

/**
 * Zod schema generator
 */
export const z = zod

/**
 * Converts a Zod schema to a JSON schema
 * @param z
 * @param options
 * @returns
 */
export function zodToJsonSchema(z: zod.ZodType<any>, options?: object): any {
    const definitions = _zodToJsonSchema(z, {
        name: "schema",
        target: "openAi",
        ...(options || {}),
    }).definitions
    console.log(JSON.stringify(definitions, null, 2))
    const keys = Object.keys(definitions)
    const schema = definitions[keys[0]]
    return schema
}
