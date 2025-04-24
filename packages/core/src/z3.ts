import { CancellationOptions, checkCancelled } from "./cancellation"
import { genaiscriptDebug } from "./debug"
import { TraceOptions } from "./trace"
import { logWarn } from "./util"

const dbg = genaiscriptDebug("z3")

let _z3: Promise<ReturnType<(typeof import("z3-solver"))["init"]>> = undefined

async function importZ3(): Promise<
    ReturnType<(typeof import("z3-solver"))["init"]>
> {
    try {
        dbg(`importing z3-solver`)
        const z3 = await import("z3-solver")
        dbg(`initializing`)
        const res = await z3.init()
        dbg(`initialized`)
        return res
    } catch (e) {
        dbg(e?.message)
        return undefined
    }
}

export async function loadZ3Client(
    options?: TraceOptions & CancellationOptions
): Promise<Z3Solver> {
    const { trace, cancellationToken } = options || {}
    const z3p = await (_z3 || (_z3 = importZ3()))
    checkCancelled(cancellationToken)
    if (!z3p) {
        logWarn(
            "Z3 not available. Make sure to install the https://www.npmjs.com/package/z3-solver package."
        )
        return undefined
    }
    const { Z3 } = z3p
    dbg(`loaded z3-solver`)
    return Object.freeze({
        run: Z3Run,
        api: () => Z3,
    }) satisfies Z3Solver

    async function Z3Run(input: string) {
        if (!input) throw new Error("No input provided")

        checkCancelled(cancellationToken)
        dbg(`run: %s`, input)
        const cfg = Z3.mk_config()
        const ctx = Z3.mk_context(cfg)
        Z3.del_config(cfg)

        const timeStart = new Date().getTime()
        const timeout = 10000

        Z3.global_param_set("timeout", String(timeout))

        let output = ""
        let error = ""

        try {
            output = (await Z3.eval_smtlib2_string(ctx, input)) ?? ""
        } finally {
            Z3.del_context(ctx)
        }
        dbg(`output: %s`, output)
        if (/unknown/.test(output)) {
            const timeEnd = new Date().getTime()
            if (timeEnd - timeStart >= timeout)
                throw new Error("Z3 timeout, " + output)
        }
        return output
    }
}
