import { JSON5parse } from "./json5"
import { MarkdownTrace } from "./trace"
import Ajv from "ajv"
import { YAMLParse } from "./yaml"
import { errorMessage } from "./error"
import { promptParametersSchemaToJSONSchema } from "./parameters"

export function isJSONSchema(obj: any) {
    if (typeof obj === "object" && obj.type === "object") return true
    if (typeof obj === "object" && obj.type === "array") return true
    return false
}

export function JSONSchemaStringifyToTypeScript(
    schema: JSONSchema,
    options?: { typeName?: string; export?: boolean }
) {
    const { typeName = "Response" } = options || {}
    let lines: string[] = []
    let indent = 0

    appendJsDoc(schema.description)
    append(
        `${options?.export ? "export " : ""}type ${typeName.replace(/\s+/g, "_")} =`
    )
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

    function stringifyNodeDoc(node: JSONSchemaType): string {
        const doc = [node.description]
        switch (node.type) {
            case "number":
            case "integer": {
                if (node.minimum !== undefined)
                    doc.push(`minimum: ${node.minimum}`)
                if (node.exclusiveMinimum !== undefined)
                    doc.push(`exclusiveMinimum: ${node.exclusiveMinimum}`)
                if (node.exclusiveMaximum !== undefined)
                    doc.push(`exclusiveMaximum : ${node.exclusiveMaximum}`)
                if (node.maximum !== undefined)
                    doc.push(`maximum: ${node.maximum}`)
            }
        }
        return doc.filter((d) => d).join("\n")
    }

    function stringifyObject(object: JSONSchemaObject): void {
        const { required, additionalProperties } = object
        append(`{`)
        indent++
        if (additionalProperties) append(`[key: string]: any,`)
        Object.keys(object.properties).forEach((key) => {
            const prop = object.properties[key]
            const field = `${key}${required?.includes(key) ? "" : "?"}`
            const doc = stringifyNodeDoc(prop)
            appendJsDoc(doc)
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

export async function validateSchema(schema: JSONSchema) {
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
            trace?.warn(`schema validation failed`)
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
        trace?.warn("schema validation failed")
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

export function JSONSchemaStringify(schema: JSONSchema) {
    return JSON.stringify(
        {
            $schema:
                schema.$schema ?? "http://json-schema.org/draft-07/schema#",
            ...schema,
        },
        null,
        2
    )
}

// https://platform.openai.com/docs/guides/structured-outputs/supported-schemas
export function toStrictJSONSchema(
    schema: PromptParametersSchema | JSONSchema
): any {
    const clone: JSONSchema = structuredClone(
        promptParametersSchemaToJSONSchema(schema)
    )
    visit(clone)

    if (clone.type !== "object")
        throw new Error("top level schema must be object")

    function visit(node: JSONSchemaType): void {
        const { type } = node
        switch (type) {
            case "object": {
                if (node.additionalProperties)
                    throw new Error("additionalProperties: true not supported")
                node.additionalProperties = false
                node.required = node.required || []
                for (const key in node.properties) {
                    // https://platform.openai.com/docs/guides/structured-outputs/all-fields-must-be-required
                    const child = node.properties[key]
                    visit(child)
                    if (!node.required.includes(key)) {
                        node.required.push(key)
                        if (
                            ["string", "number", "boolean", "integer"].includes(
                                child.type
                            )
                        ) {
                            child.type = [child.type, "null"] as any
                        }
                    }
                }
                break
            }
            case "array": {
                visit(node.items)
                break
            }
        }
    }
    return clone
}
