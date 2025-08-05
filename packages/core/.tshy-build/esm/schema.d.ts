import type { MarkdownTrace, TraceOptions } from "./trace.js";
import type { DataFrame, Fenced, FileEditValidation, JSONSchema, JSONSchemaType, JSONSchemaTypeName, JSONSchemaValidationOptions, PromptParametersSchema } from "./types.js";
/**
 * Checks if the given object is a valid JSON Schema.
 * @param obj - The object to validate as a JSON Schema.
 * @returns True if the object is a valid JSON Schema, false otherwise.
 */
export declare function isJSONSchema(obj: any): boolean;
/**
 * Converts a JSON Schema into a TypeScript function parameters string.
 *
 * @param schema - The JSON Schema to convert. Supports objects, arrays, and primitive types.
 * @returns A string representation of function parameters, compatible with the provided schema.
 */
export declare function JSONSchemaToFunctionParameters(schema: JSONSchemaType | JSONSchemaTypeName): string;
/**
 * Converts a JSON Schema into a TypeScript type definition string.
 * @param schema - The JSON Schema to convert. Supports objects, arrays, and primitive types.
 * @param options - Optional settings, including the type name and whether to export the type.
 *                  The typeName specifies the name of the generated type.
 * @returns The TypeScript type definition as a string, including JSDoc comments for schema descriptions.
 */
export declare function JSONSchemaStringifyToTypeScript(schema: JSONSchema | JSONSchemaType, options?: {
    typeName?: string;
    export?: boolean;
}): string;
/**
 * Validates a JSON Schema using Ajv.
 * @param schema - The JSON Schema to validate.
 * @returns A Promise resolving with the validation result, indicating whether the schema is valid or not.
 */
export declare function validateSchema(schema: JSONSchema): Promise<unknown>;
export declare function tryValidateJSONWithSchema<T = unknown>(object: T, options?: JSONSchemaValidationOptions & TraceOptions): T;
/**
 * Validates a JSON object against a specified JSON schema.
 * @param object - The JSON object to validate.
 * @param schema - The JSON schema to validate against.
 * @param options - Optional debugging options, including trace for logging validation details.
 * @returns Validation result indicating success status and error details if validation fails.
 */
export declare function validateJSONWithSchema(object: any, schema: JSONSchema, options?: TraceOptions): FileEditValidation;
/**
 * Validates multiple JSON or YAML code blocks against specified schemas.
 *
 * @param fences - Array of code blocks with metadata, language, and content to validate.
 * @param schemas - Mapping of schema names to JSON Schemas used for validation.
 * @param options - Optional debugging settings, including trace for logging validation details.
 * @returns Array of data frames containing validation results, parsed data, and associated schemas.
 */
export declare function validateFencesWithSchema(fences: Fenced[], schemas: Record<string, JSONSchema>, options?: {
    trace: MarkdownTrace;
}): DataFrame[];
/**
 * Converts a JSON Schema into its JSON string representation.
 * @param schema - The JSON Schema to be converted, including optional $schema property.
 * @returns The formatted JSON string representation of the schema.
 */
export declare function JSONSchemaStringify(schema: JSONSchema): string;
/**
 * Converts a schema to a strict JSON Schema by enforcing stricter validation rules.
 * Ensures all fields are required and disallows additional properties.
 * Recursively processes nested schemas to apply strict constraints.
 * Deletes unsupported properties like uiType and uiSuggestions.
 * Throws an error if the top-level schema is not an object or if additionalProperties is true.
 * @param schema - The schema to convert, either a PromptParametersSchema or JSONSchema.
 * @returns A strict JSON Schema with enforced constraints.
 */
export declare function toStrictJSONSchema(schema: PromptParametersSchema | JSONSchema, options?: {
    noDefaults?: boolean;
    defaultOptional?: boolean;
}): any;
/**
 * Infers a JSON Schema from the given object.
 *
 * @param obj - The input object for which to infer a JSON Schema.
 *               This can include nested objects, arrays, and primitives.
 * @returns A Promise resolving to the inferred JSON Schema.
 */
export declare function JSONSchemaInfer(obj: any): Promise<JSONSchema>;
//# sourceMappingURL=schema.d.ts.map