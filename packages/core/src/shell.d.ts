/**
 * Parses a shell command into an array of arguments.
 *
 * @param cmd - The shell command string to be parsed.
 * @returns An array of arguments, excluding comments. For non-string elements,
 *          it resolves operation types (e.g., globs or operators) and includes them in the result.
 */
export declare function shellParse(cmd: string): string[];
/**
 * Quotes an array of strings for safe use in a shell command.
 *
 * @param args - An array of strings representing the components of a shell command.
 *               Each string will be quoted as necessary to ensure it is interpreted correctly by the shell.
 * @returns A single string where the input arguments are properly quoted for shell usage.
 */
export declare function shellQuote(args: string[]): string;
/**
 * Removes ANSI escape codes used for ASCII colors from a given string.
 *
 * @param text - The input string containing potential ANSI color codes.
 * @returns The string with ANSI color codes removed.
 */
export declare function shellRemoveAsciiColors(text: string): string;
//# sourceMappingURL=shell.d.ts.map