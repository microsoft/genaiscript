import { MarkdownTrace } from "./trace"
import Ajv from "ajv"

export function stringifySchemaToTypeScript(
    schema: JSONSchema,
    options?: { typeName?: string }
) {
    const { typeName = "Response" } = options || {}
    let res = stringifyNode(schema)
    if (schema.type === "object") res = `interface ${typeName} ${res}`
    else if (schema.type === "array") res = `type ${typeName} = ${res}`
    return res

    function stringifyNode(node: JSONSchemaType): string {
        if (node === undefined) return "any"
        else if (node.type === "array") return stringifyArray(node)
        else if (node.type === "object") return stringifyObject(node)
        else if (node.type === "string") return "string"
        else if (node.type === "boolean") return "boolean"
        else if (node.type === "number" || node.type === "integer")
            return "number"
        else return "unknown"
    }

    function stringifyObject(object: JSONSchemaObject): string {
        const required = object.required
        return `{ ${Object.keys(object.properties)
            .map(
                (key) =>
                    `${key}${required?.includes(key) ? "" : "?"}: ${stringifyNode(object.properties[key])}`
            )
            .join(", ")} }`
    }

    function stringifyArray(array: JSONSchemaArray): string {
        return `Array<${stringifyNode(array.items)}>`
    }
}

export async function validateSchema(trace: MarkdownTrace, schema: JSONSchema) {
    const ajv = new Ajv()
    return await ajv.validateSchema(schema, false)
}

export function validateJSONWithSchema(
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
