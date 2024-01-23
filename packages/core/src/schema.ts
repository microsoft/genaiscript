import { MarkdownTrace } from "./trace"
import Ajv from "ajv"

export function validateSchema(
    trace: MarkdownTrace,
    object: any,
    schema: JSONSchema
): boolean {
    try {
        const ajv = new Ajv()
        const validate = ajv.compile(schema)
        const valid = validate(object)
        if (!valid) {
            trace.error(`schema validation failed`)
            trace.fence(validate.errors)
            trace.fence(schema, "json")
            return false
        }
        return true
    } catch (e) {
        trace.error("schema validation failed", e)
        return false
    }
}
