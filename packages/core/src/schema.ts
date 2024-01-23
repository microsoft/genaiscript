import { MarkdownTrace } from "./trace"
import Ajv from "ajv"

export interface JSONSchemaValidation {
    valid: boolean
    errors?: string
}

export function validateJSONSchema(
    trace: MarkdownTrace,
    object: any,
    schema: JSONSchema
): JSONSchemaValidation {
    try {
        const ajv = new Ajv()
        const validate = ajv.compile(schema)
        const valid = validate(object)
        if (!valid) {
            trace.error(`schema validation failed`)
            trace.fence(validate.errors)
            trace.fence(schema, "json")
            return {
                valid: false,
                errors: ajv.errorsText(validate.errors),
            }
        }
        return { valid: true }
    } catch (e) {
        trace.error("schema validation failed", e)
        return { valid: false, errors: e.message }
    }
}
