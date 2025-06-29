// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { CancellationOptions, checkCancelled, genaiscriptDebug, logWarn } from "@genaiscript/core";

const dbg = genaiscriptDebug("z3");

let _z3: Promise<ReturnType<(typeof import("z3-solver"))["init"]>> = undefined;

async function importZ3(): Promise<ReturnType<(typeof import("z3-solver"))["init"]>> {
  try {
    dbg(`importing z3-solver`);
    dbg(`initializing`);
    const z3 = await import("z3-solver");
    const res = await z3.init();
    dbg(`initialized`);
    return res;
  } catch (e) {
    dbg(e?.message);
    return undefined;
  }
}

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
export async function z3(options?: CancellationOptions): Promise<Z3Solver> {
  const { cancellationToken } = options || {};
  const z3p = await (_z3 || (_z3 = importZ3()));
  checkCancelled(cancellationToken);
  if (!z3p) {
    logWarn(
      "Z3 not available. Make sure to install the https://www.npmjs.com/package/z3-solver package.",
    );
    return undefined;
  }
  const { Z3 } = z3p;
  dbg(`loaded z3-solver`);
  return Object.freeze({
    run: Z3Run,
    api: () => Z3,
  }) satisfies Z3Solver;

  async function Z3Run(input: string) {
    if (!input) throw new Error("No input provided");

    checkCancelled(cancellationToken);
    dbg(`run: %s`, input);
    const cfg = Z3.mk_config();
    const ctx = Z3.mk_context(cfg);
    Z3.del_config(cfg);

    const timeStart = new Date().getTime();
    const timeout = 10000;

    Z3.global_param_set("timeout", String(timeout));

    let output = "";

    try {
      output = (await Z3.eval_smtlib2_string(ctx, input)) ?? "";
    } finally {
      Z3.del_context(ctx);
    }
    dbg(`output: %s`, output);
    if (/unknown/.test(output)) {
      const timeEnd = new Date().getTime();
      if (timeEnd - timeStart >= timeout) throw new Error("Z3 timeout, " + output);
    }
    return output;
  }
}

export interface Z3Solver {
  /**
   * Runs Z3 on a given SMT string
   * @param smt
   */
  run(smt: string): Promise<string>;

  /**
   * Native underlying Z3 api
   */
  api(): unknown;
}
