import { parse } from "dotenv";
/**
 * Safely parses a dotenv-style string into a key-value object.
 * If parsing fails, logs the error and returns an empty object.
 *
 * @param text - The dotenv file content as a string
 * @returns A record with key-value pairs from the dotenv file
 */
export declare function dotEnvTryParse(text: string): Record<string, string>;
export declare const dotEnvParse: typeof parse;
/**
 * Converts a key-value record into a dotenv-style string.
 * If values contain newlines or quotes, they are enclosed in double quotes and escaped.
 *
 * @param record - An object representing key-value pairs
 * @returns A dotenv-formatted string
 */
export declare function dotEnvStringify(record: Record<string, string>): string;
//# sourceMappingURL=dotenv.d.ts.map
