import { evaluate } from "mathjs"
import { TraceOptions } from "./trace"

export function MathTryEvaluate(
    expr: string,
    options?: { defaultValue?: number } & TraceOptions
): string | number | undefined {
    const { trace, defaultValue } = options || {}
    try {
        if (!expr) return defaultValue
        const res = evaluate(expr)
        return res
    } catch (e) {
        trace?.error(e)
        return undefined
    }
}
