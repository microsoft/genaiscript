import { JSON5parse } from "./json5"
import { MarkdownTrace } from "./trace"
import Ajv from "ajv"
import { YAMLParse } from "./yaml"
import { errorMessage } from "./error"

export function isJSONSchema(obj: any) {
    if (typeof obj === "object" && obj.type === "object") return true
    if (typeof obj === "object" && obj.type === "array") return true
    return false
}

export function stringifySchemaToTypeScript(
    schema: JSONSchema,
    options?: { typeName?: string }
) {
    const { typeName = "Response" } = options || {}
    let lines: string[] = []
    let indent = 0

    appendJsDoc(schema.description)
    append(`type ${typeName.replace(/\s+/g, "_")} =`)
    stringifyNode(schema)
    return lines.join("\n")

    function append(line: string) {
        if (/=$/.test(lines[lines.length - 1]))
            lines[lines.length - 1] = lines[lines.length - 1] + " " + line
        else if (/[<}]$/.test(lines[lines.length - 1]))
            lines[lines.length - 1] = lines[lines.length - 1] + line
        else lines.push("  ".repeat(indent) + line)
    }

    function appendJsDoc(text: string) {
        if (!text) return
        if (text.indexOf("\n") > -1)
            append(
                `/* ${text.split(/\n/g).join("\n" + "  ".repeat(indent))} */`
            )
        else append(`// ${text}`)
    }

    function stringifyNode(node: JSONSchemaType): string {
        if (node === undefined) return "any"
        else if (node.type === "array") {
            stringifyArray(node)
            return undefined
        } else if (node.type === "object") {
            stringifyObject(node)
            return undefined
        } else if (node.type === "string") return "string"
        else if (node.type === "boolean") return "boolean"
        else if (node.type === "number" || node.type === "integer")
            return "number"
        else return "unknown"
    }

    function stringifyObject(object: JSONSchemaObject): void {
        const { required, additionalProperties } = object
        append(`{`)
        indent++
        if (additionalProperties) append(`[key: string]: any,`)
        Object.keys(object.properties).forEach((key) => {
            const prop = object.properties[key]
            const field = `${key}${required?.includes(key) ? "" : "?"}`
            appendJsDoc(prop.description)
            append(`${field}:`)
            const v = stringifyNode(prop)
            if (v) lines[lines.length - 1] = lines[lines.length - 1] + " " + v
            lines[lines.length - 1] = lines[lines.length - 1] + ","
        })
        indent--
        append(`}`)
    }

    function stringifyArray(array: JSONSchemaArray): void {
        append(`Array<`)
        indent++
        const v = stringifyNode(array.items)
        indent--
        if (v) lines[lines.length - 1] = lines[lines.length - 1] + v + ">"
        else append(`>`)
    }
}

export async function validateSchema(trace: MarkdownTrace, schema: JSONSchema) {
    const ajv = new Ajv()
    return await ajv.validateSchema(schema, false)
}

export function validateJSONWithSchema(
    object: any,
    schema: JSONSchema,
    options?: { trace: MarkdownTrace }
): JSONSchemaValidation {
    const { trace } = options || {}
    if (!schema)
        return {
            valid: false,
            error: "no schema provided",
        }

    try {
        const ajv = new Ajv()
        const validate = ajv.compile(schema)
        const valid = validate(object)
        if (!valid) {
            trace?.error(`schema validation failed`)
            trace?.fence(validate.errors)
            trace?.fence(schema, "json")
            return {
                schema,
                valid: false,
                error: ajv.errorsText(validate.errors),
            }
        }
        return { schema, valid: true }
    } catch (e) {
        trace?.error("schema validation failed", e)
        return { schema, valid: false, error: errorMessage(e) }
    }
}

export function validateFencesWithSchema(
    fences: Fenced[],
    schemas: Record<string, JSONSchema>,
    options?: { trace: MarkdownTrace }
): DataFrame[] {
    const frames: DataFrame[] = []
    // validate schemas in fences
    for (const fence of fences?.filter(
        ({ language, args }) =>
            args?.schema && (language === "json" || language === "yaml")
    )) {
        const { language, content: val, args } = fence
        const schema = args?.schema

        // validate well formed json/yaml
        let data: any
        try {
            if (language === "json") data = JSON5parse(val, { repair: true })
            else if (language === "yaml") data = YAMLParse(val)
        } catch (e) {
            fence.validation = {
                valid: false,
                error: errorMessage(e),
            }
        }
        if (!fence.validation) {
            // check if schema specified
            const schemaObj = schemas[schema]
            if (!schemaObj) {
                fence.validation = {
                    valid: false,
                    error: `schema ${schema} not found`,
                }
            } else
                fence.validation = validateJSONWithSchema(
                    data,
                    schemaObj,
                    options
                )
        }

        // add to frames
        frames.push({
            schema,
            data,
            validation: fence.validation,
        })
    }
    return frames
}
