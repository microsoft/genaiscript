import inspect from "object-inspect"

export function consoleLogFormat(...args: any[]) {
    let line = ""
    for (let i = 0; i < args.length; ++i) {
        if (i > 0) line += " "
        const a = args[i]
        switch (typeof a) {
            case "bigint":
            case "number":
            case "string":
            case "boolean":
            case "undefined":
                line += a
                break
            case "symbol":
                line += a.toString()
                break
            case "object":
            case "function":
                line += inspect(a)
                break
        }
    }
    return line
}
