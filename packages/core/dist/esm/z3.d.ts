import { CancellationOptions } from "./cancellation.js";
import { TraceOptions } from "./trace.js";
/**
 * Loads and initializes the Z3 SMT solver client.
 *
 * Optionally accepts trace and cancellation options.
 * Returns a Z3Solver object if the Z3 solver module is properly installed and initialized, otherwise returns undefined.
 *
 * @param options Optional trace and cancellation options.
 *   - trace: Enables debug tracing for the Z3 solver.
 *   - cancellationToken: Token to allow cancellation of the initialization or run operation.
 *
 * @returns An object with:
 *   - run(input): Runs an SMT-LIB2 string input on the Z3 solver and returns its output. Throws on timeout or input error.
 *   - api(): Returns the raw Z3 API.
 *
 * Logs a warning if the Z3 solver module is not available. Ensures cancellation checks are respected at initialization and execution.
 */
export declare function loadZ3Client(
  options?: TraceOptions & CancellationOptions,
): Promise<Z3Solver>;
//# sourceMappingURL=z3.d.ts.map
