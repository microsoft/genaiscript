import inspect from "object-inspect"

/**
 * Formats console log arguments into a single string.
 *
 * This function concatenates multiple arguments into a single line of text,
 * handling various data types including numbers, strings, booleans,
 * undefined, symbols, objects, and functions. Objects and functions will 
 * be stringified using the 'inspect' utility for better readability.
 * 
 * @param args - The arguments to format.
 * @returns The formatted string representation of the provided arguments.
 */
export function consoleLogFormat(...args: any[]) {
    let line = ""
    for (let i = 0; i < args.length; ++i) {
        if (i > 0) line += " "
        const a = args[i]
        switch (typeof a) {
            case "bigint":
            case "number":
            case "boolean":
            case "undefined":
                line += a
                break
            case "string":
                line += a
                break
            case "symbol":
                line += a.toString()
                break
            case "object":
            case "function":
                line += inspect(a, {
                    indent: 2,
                    depth: 4,
                    maxStringLength: 2048,
                })
                break
        }
    }
    return line
}
