// Import necessary modules and functions
import { JSON5parse } from "./json5"
import { MarkdownTrace, TraceOptions } from "./trace"
import Ajv from "ajv"
import { YAMLParse } from "./yaml"
import { errorMessage } from "./error"
import { promptParametersSchemaToJSONSchema } from "./parameters"
import { genaiscriptDebug } from "./debug"
const dbg = genaiscriptDebug("schema")

/**
 * Checks if the given object is a valid JSON Schema.
 * @param obj - The object to validate as a JSON Schema.
 * @returns True if the object is a valid JSON Schema, false otherwise.
 */
export function isJSONSchema(obj: any) {
    if (typeof obj === "object" && obj.type === "object") return true
    if (typeof obj === "object" && obj.type === "array") return true
    return false
}

/**
 * Converts a JSON Schema into a TypeScript function parameters string.
 *
 * @param schema - The JSON Schema to convert. Supports objects, arrays, and primitive types.
 * @returns A string representation of function parameters, compatible with the provided schema.
 */
export function JSONSchemaToFunctionParameters(
    schema: JSONSchemaType | JSONSchemaTypeName
): string {
    return renderJSONSchemaToFunctionParameters(schema, 0)
}

function renderJSONSchemaToFunctionParameters(
    schema: JSONSchemaType | JSONSchemaTypeName,
    depth: number
): string {
    depth = depth + 1
    if (!schema) return ""
    else if (schema === "string") return "string"
    else if (schema === "number") return "number"
    else if (schema === "integer") return "number"
    else if (schema === "boolean") return "boolean"
    else if (schema === "null") return "null"
    else if ((schema as JSONSchemaAnyOf).anyOf) {
        const anyof = schema as JSONSchemaAnyOf
        delete anyof.uiGroup
        return (anyof.anyOf || [])
            .map((x) => renderJSONSchemaToFunctionParameters(x, depth))
            .join(" | ")
    } else if (Array.isArray(schema)) {
        return schema
            .filter((t) => t !== "null")
            .map((x) => renderJSONSchemaToFunctionParameters(x, depth))
            .join(" | ")
    } else {
        const single = schema as JSONSchemaSimpleType
        if (single.type === "array") {
            return `{ ${renderJSONSchemaToFunctionParameters(single.items, depth)} }[]`
        } else if (single.type === "object") {
            const required = single.required || []
            return `${depth > 1 ? `{ ` : ""}${Object.entries(single.properties)
                .sort(
                    (l, r) =>
                        (required.includes(l[0]) ? -1 : 1) -
                        (required.includes(r[0]) ? -1 : 1)
                )
                .map(
                    ([name, prop]) =>
                        `${name}${required.includes(name) ? "" : "?"}: ${renderJSONSchemaToFunctionParameters(prop, depth)}`
                )
                .join(", ")}${depth > 1 ? " }" : ""}`
        } else if (single.type === "string") return "string"
        else if (single.type === "boolean") return "boolean"
        else if (single.type === "number" || single.type === "integer")
            return "number"
    }
    return "?"
}

/**
 * Converts a JSON Schema into a TypeScript type definition string.
 * @param schema - The JSON Schema to convert. Supports objects, arrays, and primitive types.
 * @param options - Optional settings, including the type name and whether to export the type.
 *                  The typeName specifies the name of the generated type.
 * @returns The TypeScript type definition as a string, including JSDoc comments for schema descriptions.
 */
export function JSONSchemaStringifyToTypeScript(
    schema: JSONSchema | JSONSchemaType,
    options?: { typeName?: string; export?: boolean }
) {
    const { typeName = "Response" } = options || {}
    let lines: string[] = [] // Array to accumulate lines of TypeScript code
    let indent = 0 // Manage indentation level

    const described = schema as JSONSchemaDescribed
    appendJsDoc(described.title, described.description) // Add JSDoc for schema description
    append(
        `${options?.export ? "export " : ""}type ${typeName.replace(/\s+/g, "_")} =`
    )
    stringifyNode(schema) // Convert schema to TypeScript
    const res = lines.join("\n") // Join lines into a single TypeScript definition
    dbg(res)
    return res

    // Append a line to the TypeScript definition
    function append(line: string) {
        if (/=$/.test(lines[lines.length - 1]))
            lines[lines.length - 1] = lines[lines.length - 1] + " " + line
        else if (/[<}]$/.test(lines[lines.length - 1]))
            lines[lines.length - 1] = lines[lines.length - 1] + line
        else lines.push("  ".repeat(indent) + line)
    }

    // Append JSDoc comments
    function appendJsDoc(...parts: string[]) {
        const text = parts?.filter((d) => d).join("\n")
        if (!text) return
        if (text.indexOf("\n") > -1)
            append(
                `/* ${text.split(/\n/g).join("\n" + "  ".repeat(indent))} */`
            )
        else append(`// ${text}`)
    }

    // Convert a JSON Schema node to TypeScript
    function stringifyNode(node: JSONSchemaType): string {
        if (node === undefined) return "any"
        else if ((node as JSONSchemaAnyOf).anyOf) {
            const n = node as JSONSchemaAnyOf
            return n.anyOf
                .map((x) => {
                    const v = stringifyNode(x)
                    return /\s/.test(v) ? `(${v})` : v
                })
                .filter((x) => x)
                .join(" | ")
        } else {
            const n = node as JSONSchemaSimpleType
            if (n.type === "array") {
                stringifyArray(n)
                return undefined
            } else if (n.type === "object") {
                stringifyObject(n)
                return undefined
            } else if (n.type === "string") return "string"
            else if (n.type === "boolean") return "boolean"
            else if (n.type === "number" || n.type === "integer")
                return "number"
        }
        return "unknown"
    }

    // Extract documentation for a node
    function stringifyNodeDoc(node: JSONSchemaType): string {
        const n = node as JSONSchemaSimpleType
        const doc = [n?.title, n?.description]
        switch (n.type) {
            case "number":
            case "integer": {
                if (n.minimum !== undefined) doc.push(`minimum: ${n.minimum}`)
                if (n.exclusiveMinimum !== undefined)
                    doc.push(`exclusiveMinimum: ${n.exclusiveMinimum}`)
                if (n.exclusiveMaximum !== undefined)
                    doc.push(`exclusiveMaximum : ${n.exclusiveMaximum}`)
                if (n.maximum !== undefined) doc.push(`maximum: ${n.maximum}`)
                break
            }
            case "string": {
                if (n.pattern) doc.push(`pattern: ${n.pattern}`)
                break
            }
        }
        return doc.filter((d) => d).join("\n")
    }

    // Convert a JSON Schema object to TypeScript
    function stringifyObject(object: JSONSchemaObject): void {
        const { required, properties, additionalProperties } = object
        append(`{`)
        indent++
        if (additionalProperties) append(`[key: string]: any,`)
        if (properties)
            Object.keys(properties).forEach((key) => {
                const prop = properties[key]
                const field = `${key}${required?.includes(key) ? "" : "?"}`
                const doc = stringifyNodeDoc(prop)
                appendJsDoc(doc)
                append(`${field}:`)
                const v = stringifyNode(prop)
                if (v)
                    lines[lines.length - 1] = lines[lines.length - 1] + " " + v
                lines[lines.length - 1] = lines[lines.length - 1] + ","
            })
        indent--
        append(`}`)
    }

    // Convert a JSON Schema array to TypeScript
    function stringifyArray(array: JSONSchemaArray): void {
        indent++
        append(`Array<`)
        const v = stringifyNode(array.items)
        indent--
        if (v) lines[lines.length - 1] = lines[lines.length - 1] + v + ">"
        else append(`>`)
    }
}

/**
 * Validates a JSON Schema using Ajv.
 * @param schema - The JSON Schema to validate.
 * @returns A Promise resolving with the validation result, indicating whether the schema is valid or not.
 */
export async function validateSchema(schema: JSONSchema) {
    const ajv = new Ajv()
    return await ajv.validateSchema(schema, false)
}

export function tryValidateJSONWithSchema<T = unknown>(
    object: T,
    options?: JSONSchemaValidationOptions & TraceOptions
) {
    const { schema, throwOnValidationError, trace } = options || {}
    if (object !== undefined && schema) {
        const validation = validateJSONWithSchema(object, schema, { trace })
        if (validation.schemaError) {
            dbg("%O", validation)
            if (throwOnValidationError) throw new Error(validation.schemaError)
            return undefined
        }
    }
    return object
}

/**
 * Validates a JSON object against a specified JSON schema.
 * @param object - The JSON object to validate.
 * @param schema - The JSON schema to validate against.
 * @param options - Optional debugging options, including trace for logging validation details.
 * @returns Validation result indicating success status and error details if validation fails.
 */
export function validateJSONWithSchema(
    object: any,
    schema: JSONSchema,
    options?: { trace: MarkdownTrace }
): FileEditValidation {
    const { trace } = options || {}
    if (!schema)
        return {
            pathValid: false,
            schemaError: "no schema provided",
        }

    try {
        const ajv = new Ajv({
            allowUnionTypes: true,
        })
        const validate = ajv.compile(schema)
        const valid = validate(object)
        if (!valid) {
            dbg(`validation failed: ${ajv.errorsText(validate.errors)}`)
            trace?.warn(`schema validation failed`)
            trace?.fence(validate.errors)
            trace?.fence(schema, "json")
            return {
                schema,
                pathValid: false,
                schemaError: ajv.errorsText(validate.errors),
            }
        }
        return { schema, pathValid: true }
    } catch (e) {
        dbg(`runtime error: ${errorMessage(e)}`)
        trace?.warn("schema validation failed")
        return { schema, pathValid: false, schemaError: errorMessage(e) }
    }
}

/**
 * Validates multiple JSON or YAML code blocks against specified schemas.
 *
 * @param fences - Array of code blocks with metadata, language, and content to validate.
 * @param schemas - Mapping of schema names to JSON Schemas used for validation.
 * @param options - Optional debugging settings, including trace for logging validation details.
 * @returns Array of data frames containing validation results, parsed data, and associated schemas.
 */
export function validateFencesWithSchema(
    fences: Fenced[],
    schemas: Record<string, JSONSchema>,
    options?: { trace: MarkdownTrace }
): DataFrame[] {
    const frames: DataFrame[] = []
    // Validate schemas in fences
    for (const fence of fences?.filter(
        ({ language, args }) =>
            args?.schema && (language === "json" || language === "yaml")
    )) {
        const { language, content: val, args } = fence
        const schema = args?.schema

        // Validate well-formed JSON/YAML
        let data: any
        try {
            if (language === "json") data = JSON5parse(val, { repair: true })
            else if (language === "yaml") data = YAMLParse(val)
        } catch (e) {
            fence.validation = {
                pathValid: false,
                schemaError: errorMessage(e),
            }
        }
        if (!fence.validation) {
            // Check if schema specified
            const schemaObj = schemas[schema]
            if (!schemaObj) {
                fence.validation = {
                    pathValid: false,
                    schemaError: `schema ${schema} not found`,
                }
            } else
                fence.validation = validateJSONWithSchema(
                    data,
                    schemaObj,
                    options
                )
        }

        // Add to frames
        frames.push({
            schema,
            data,
            validation: fence.validation,
        })
    }
    return frames
}

/**
 * Converts a JSON Schema into its JSON string representation.
 * @param schema - The JSON Schema to be converted, including optional $schema property.
 * @returns The formatted JSON string representation of the schema.
 */
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

/**
 * Converts a schema to a strict JSON Schema by enforcing stricter validation rules.
 * Ensures all fields are required and disallows additional properties.
 * Recursively processes nested schemas to apply strict constraints.
 * Deletes unsupported properties like uiType and uiSuggestions.
 * Throws an error if the top-level schema is not an object or if additionalProperties is true.
 * @param schema - The schema to convert, either a PromptParametersSchema or JSONSchema.
 * @returns A strict JSON Schema with enforced constraints.
 */
export function toStrictJSONSchema(
    schema: PromptParametersSchema | JSONSchema,
    options?: {
        noDefaults?: boolean
        defaultOptional?: boolean
    }
): any {
    const { noDefaults, defaultOptional } = options || {}
    const clone: JSONSchema = structuredClone(
        promptParametersSchemaToJSONSchema(schema, { noDefaults })
    )
    visit(clone)

    //if (clone.type !== "object")
    //    throw new Error("top level schema must be object")

    // Recursive function to make the schema strict
    function visit(node: JSONSchemaType): void {
        const n = node as JSONSchemaSimpleType
        delete n.uiGroup
        switch (n.type) {
            case "boolean": {
                delete n.uiType
                break
            }
            case "string": {
                delete n.uiType
                delete n.uiSuggestions
                break
            }
            case "object": {
                if (n.additionalProperties)
                    throw new Error("additionalProperties: true not supported")
                n.additionalProperties = false
                n.required = n.required || []
                for (const key in n.properties) {
                    // https://platform.openai.com/docs/guides/structured-outputs/all-fields-must-be-required
                    const child = n.properties[key] as JSONSchemaSimpleType
                    visit(child)
                    if (!defaultOptional && !n.required.includes(key)) {
                        n.required.push(key)
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
                visit(n.items)
                break
            }
        }
    }
    return clone
}

/**
 * Infers a JSON Schema from the given object.
 *
 * @param obj - The input object for which to infer a JSON Schema.
 *               This can include nested objects, arrays, and primitives.
 * @returns A Promise resolving to the inferred JSON Schema.
 */
export async function JSONSchemaInfer(obj: any): Promise<JSONSchema> {
    const res = promptParametersSchemaToJSONSchema(obj, { noDefaults: true })
    return res
}
