// Importing TraceOptions from the local "trace" module
import { TraceOptions } from "./trace"

/**
 * Asynchronously evaluates a mathematical expression.
 * 
 * @param expr - The string expression to evaluate
 * @param options - Optional parameters including:
 *   - defaultValue: A fallback number if evaluation fails or expression is empty
 *   - trace: A tracing object for logging errors
 * 
 * @returns A Promise that resolves to the evaluation result which can be:
 *   - a number if evaluation is successful
 *   - the default value if specified and the expression is empty
 *   - undefined if evaluation fails
 */
export async function MathTryEvaluate(
    expr: string,
    options?: { defaultValue?: number } & TraceOptions
): Promise<string | number | undefined> {
    // Destructuring options with defaults
    const { trace, defaultValue } = options || {}

    try {
        // Return defaultValue if expression is empty
        if (!expr) return defaultValue

        // Dynamically import the 'evaluate' function from 'mathjs'
        const { evaluate } = await import("mathjs")

        // Evaluate the expression and return the result
        const res = evaluate(expr)
        return res
    } catch (e) {
        // Log an error if tracing is enabled
        trace?.error(e)
        
        // Return undefined if evaluation fails
        return undefined
    }
}
