import { MarkdownTrace } from "./trace"
import Ajv from "ajv"

export interface JSONSchemaValidation {
    schema?: JSONSchema
    valid: boolean
    errors?: string
}

export async function validateSchema(trace: MarkdownTrace, schema: JSONSchema) {
    const ajv = new Ajv()
    return await ajv.validateSchema(schema, false)
}

export function validateJSONSchema(
    trace: MarkdownTrace,
    object: any,
    schema: JSONSchema
): JSONSchemaValidation {
    if (!schema)
        return {
            valid: false,
            errors: "no schema provided",
        }

    try {
        const ajv = new Ajv()
        const validate = ajv.compile(schema)
        const valid = validate(object)
        if (!valid) {
            trace.error(`schema validation failed`)
            trace.fence(validate.errors)
            trace.fence(schema, "json")
            return {
                schema,
                valid: false,
                errors: ajv.errorsText(validate.errors),
            }
        }
        return { schema, valid: true }
    } catch (e) {
        trace.error("schema validation failed", e)
        return { schema, valid: false, errors: e.message }
    }
}
