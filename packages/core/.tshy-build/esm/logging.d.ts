/**
 * Formats an array of arguments into a single string for logging purposes.
 *
 * @param args - The arguments to format. Can include values of various types:
 *   - Primitive types (number, bigint, string, boolean, undefined).
 *   - Symbols, which are converted to their string representation.
 *   - Objects or functions, which are serialized using a custom inspection method.
 *
 * @returns A string representation of the input arguments.
 */
export declare function consoleLogFormat(...args: any[]): string;
//# sourceMappingURL=logging.d.ts.map