import { parse, quote } from "shell-quote"

/**
 * Parses a shell command string into an array of arguments.
 * Ignores comments and processes glob patterns appropriately.
 *
 * @param cmd - The shell command string to parse.
 * @returns An array of parsed arguments from the command string.
 */
export function shellParse(cmd: string): string[] {
    const args = parse(cmd)
    const res = args
        .filter((e) => !(e as any).comment)
        .map((e) =>
            typeof e === "string"
                ? e
                : (e as any).op === "glob"
                  ? (e as any).pattern
                  : (e as any).op
        )
    return res
}

/**
 * Quotes an array of strings for shell command usage.
 * This function takes an array of arguments and returns a single string 
 * where each argument is properly quoted for safe execution in a shell context.
 *
 * @param args - An array of strings representing command-line arguments.
 * @returns A single string with all arguments quoted.
 */
export function shellQuote(args: string[]): string {
    return quote(args)
}

/**
 * Removes ASCII color codes from the given text.
 *
 * This function takes a string input and uses a regular expression to
 * find and remove any ASCII color codes, returning the cleaned text.
 *
 * @param text - The input string potentially containing ASCII color codes.
 * @returns The text without ASCII color codes.
 */
export function shellRemoveAsciiColors(text: string) {
    return text?.replace(/\x1b\[[0-9;]*m/g, "") // ascii colors
}
