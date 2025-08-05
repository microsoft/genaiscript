/**
 * Parses an INI formatted string after cleaning it by removing fencing and resolving file content.
 *
 * @param text - INI formatted string or file content to process
 * @returns Parsed object
 */
export declare function INIParse(text: string): {
    [key: string]: any;
};
/**
 * Parses an INI formatted string, logs errors if parsing fails, and returns a default value.
 *
 * @param text - The INI formatted string or file content to parse
 * @param defaultValue - The value to return if parsing fails
 * @returns The parsed object or the default value
 */
export declare function INITryParse(text: string, defaultValue?: any): any;
/**
 * Converts an object into an INI formatted string.
 *
 * @param o - The object to stringify
 * @returns The INI formatted string
 */
export declare function INIStringify(o: any): string;
//# sourceMappingURL=ini.d.ts.map