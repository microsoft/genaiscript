export interface InspectOptions {
    /**
     * How deep to go into objects.
     *
     * @default 2
     */
    maxDepth?: number

    /**
     * Maximum length of output.
     *
     * @default 2000
     */
    maxLength?: number

    /**
     * Maximum length of string literal (inside of object).
     *
     * @default 60
     */
    maxString?: number
}

export function inspect(obj: any, options?: InspectOptions) {
    const { maxDepth = 5, maxLength = 2000, maxString = 60 } = options ?? {}

    return doInspect(obj, "", maxDepth)

    function doInspect(obj: any, pref: string, depth: number) {
        if (Array.isArray(obj)) {
            if (depth <= 0) return "[...]"
            let r = "[ "
            for (let i = 0; i < obj.length; ++i) {
                if (i > 0) r += ",\n" + pref
                r += doInspect(obj[i], pref + "  ", depth - 1)
                if (r.length > maxLength) {
                    r += "..."
                    break
                }
            }
            r += " ]"
            return r
        } else if (typeof obj == "string") {
            if (obj.length > maxString) {
                return JSON.stringify(obj.slice(0, maxString)) + "..."
            } else {
                return JSON.stringify(obj)
            }
        } else if (typeof obj == "function") {
            return `[Function: ${obj.name}]`
        } else if (obj && typeof obj == "object") {
            if (depth <= 0) return "{...}"
            let r = "{ "
            const keys = Object.keys(obj)
            for (let i = 0; i < keys.length; ++i) {
                if (i > 0) r += ",\n" + pref
                if (/^[\$\w]+$/.test(keys[i])) r += `${keys[i]}: `
                else r += JSON.stringify(keys[i]) + ": "
                r += doInspect(obj[keys[i]], pref + "  ", depth - 1)
                if (r.length > maxLength) {
                    r += "..."
                    break
                }
            }
            r += " }"
            return r
        } else {
            return obj + ""
        }
    }
}

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
