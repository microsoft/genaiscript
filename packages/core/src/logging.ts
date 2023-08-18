const maxLen = 2000

export function inspect(obj: any, depth = 2) {
    if (Array.isArray(obj)) {
        if (depth <= 0) return "[...]"
        let r = "["
        for (let i = 0; i < obj.length; ++i) {
            if (i > 0) r += ", "
            r += inspect(obj[i], depth - 1)
            if (r.length > maxLen) {
                r += "..."
                break
            }
        }
        r += "]"
        return r
    } else if (typeof obj == "string") {
        if (obj.length > maxLen) {
            return JSON.stringify(obj.slice(0, maxLen)) + "..."
        } else {
            return JSON.stringify(obj)
        }
    } else if (typeof obj == "function") {
        return `[Function: ${obj.name}]`
    } else if (obj && typeof obj == "object") {
        if (depth <= 0) return "{...}"
        let r = "{"
        const keys = Object.keys(obj)
        for (let i = 0; i < keys.length; ++i) {
            if (i > 0) r += ", "
            if (/^[\$\w]+$/.test(keys[i])) r += `${keys[i]}: `
            else r += JSON.stringify(keys[i]) + ": "
            r += inspect(obj[keys[i]], depth - 1)
            if (r.length > maxLen) {
                r += "..."
                break
            }
        }
        r += "}"
        return r
    } else {
        return obj + ""
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
