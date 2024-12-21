/**
 * GenAIScript supporting runtime
 */
import { delay as _delay } from "es-toolkit"
import { zodToJsonSchema as _zodToJsonSchema } from "zod-to-json-schema"

/**
 * A helper function to delay the execution of the script
 */
export const delay: (ms: number) => Promise<void> = _delay

/**
 * Converts a Zod schema to a JSON schema
 * @param z
 * @param options
 * @returns
 */
export function zodToJsonSchema(z: any, options?: object): any {
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
