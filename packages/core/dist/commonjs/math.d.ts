import { TraceOptions } from "./trace.js";
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
export declare function MathTryEvaluate(
  expr: string,
  options?: {
    scope?: object;
    defaultValue?: number;
  } & TraceOptions,
): Promise<string | number | undefined>;
//# sourceMappingURL=math.d.ts.map
