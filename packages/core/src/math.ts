import { TraceOptions } from "./trace"

export async function MathTryEvaluate(
    expr: string,
    options?: { defaultValue?: number } & TraceOptions
): Promise<string | number | undefined> {
    const { trace, defaultValue } = options || {}
    try {
        if (!expr) return defaultValue
        const { evaluate } = await import("mathjs")
        const res = evaluate(expr)
        return res
    } catch (e) {
        trace?.error(e)
        return undefined
    }
}
