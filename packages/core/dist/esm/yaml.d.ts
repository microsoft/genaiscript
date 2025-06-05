/**
 * Safely attempts to parse a YAML string into a JavaScript object.
 * Tries to parse the input YAML string, and returns a default value
 * in case of failure or specific conditions.
 *
 * @template T - The expected type of the parsed result.
 * @param text - The YAML string to parse.
 * @param defaultValue - A default value to return if parsing fails or if
 *                       `ignoreLiterals` is true and the result is a literal.
 * @param options - Optional settings for parsing.
 * @param options.ignoreLiterals - If true, returns the defaultValue when the
 *                                 parsed result is a primitive type (number,
 *                                 boolean, string).
 * @returns The parsed object, or the defaultValue if parsing fails or
 *          conditions are met.
 */
export declare function YAMLTryParse<T = any>(
  text: string | WorkspaceFile,
  defaultValue?: T,
  options?: {
    ignoreLiterals?: boolean;
  },
): T;
/**
 * Parses a YAML string or workspace file into a JavaScript object.
 * Converts the input to content if it is a workspace file.
 * Assumes the input is valid YAML.
 *
 * @param text - The YAML string or workspace file to parse.
 * @returns The parsed JavaScript object.
 */
export declare function YAMLParse(text: string | WorkspaceFile): any;
/**
 * Converts a JavaScript object into a YAML string.
 * This function provides a YAML representation of the input object.
 *
 * @param obj - The object to convert to YAML.
 * @returns The YAML string representation of the object.
 */
export declare function YAMLStringify(obj: any): string;
/**
 * Creates a YAML handler with template string support for parsing and stringifying YAML content.
 * Combines the functionality to parse YAML strings, stringify objects to YAML,
 * and process template string inputs into parsed YAML objects.
 *
 * The handler function allows interpolation of values within template strings,
 * parses the resulting YAML string, and returns the parsed object.
 *
 * @param strings - An array of template string literals.
 * @param values - Corresponding interpolated values to be included in the YAML string.
 * @returns A parsed object generated from the combined template strings and values.
 */
export declare function createYAML(): YAML;
//# sourceMappingURL=yaml.d.ts.map
