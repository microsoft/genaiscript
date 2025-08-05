import type { JSONSchema, JSONSchemaArray, JSONSchemaBoolean, JSONSchemaNumber, JSONSchemaObject, JSONSchemaString, PromptParametersSchema, PromptParameterType } from "./types.js";
export interface PromptParametersSchemaConversionOptions {
    noDefaults?: boolean;
}
/**
 * Converts a given prompt parameter type into its corresponding JSON Schema representation.
 *
 * @param t - The prompt parameter type or an array containing a single prompt parameter type.
 * @param options - Optional conversion options. Contains a flag to skip default values in schema generation.
 * @returns A JSON Schema representation of the provided prompt parameter type. Supports string, number, boolean, object, and array types.
 * @throws Will throw an error if the input type is not supported.
 */
export declare function promptParameterTypeToJSONSchema(t: PromptParameterType | [PromptParameterType], options?: PromptParametersSchemaConversionOptions): JSONSchemaNumber | JSONSchemaString | JSONSchemaBoolean | JSONSchemaObject | JSONSchemaArray;
/**
 * Converts a PromptParametersSchema or JSONSchema into JSONSchema format.
 *
 * @param parameters - The parameters schema to be converted. Can be a PromptParametersSchema, a JSONSchema, or undefined. If undefined, returns undefined.
 * @param options - Optional conversion options which may include whether to exclude default values.
 * @returns A JSONSchema object or undefined if the input parameters are undefined.
 */
export declare function promptParametersSchemaToJSONSchema(parameters: PromptParametersSchema | JSONSchema | undefined, options?: PromptParametersSchemaConversionOptions): JSONSchema | undefined;
//# sourceMappingURL=parameters.d.ts.map