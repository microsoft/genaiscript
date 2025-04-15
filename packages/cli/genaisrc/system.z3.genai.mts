system({
    title: "Zero-shot Chain Of Thought",
    description:
        "Zero-shot Chain Of Thought technique. More at https://learnprompting.org/docs/intermediate/zero_shot_cot.",
})
const dbg = host.logger("system:z3")

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

async function Z3Run(context: ToolCallContext, input: string) {
    // init z3
    const z3p = await (_z3 || (_z3 = importZ3()))
    if (!z3p) {
        context.log(
            "Z3 not available. Make sure to install the https://www.npmjs.com/package/z3-solver package."
        )
        return undefined
    }

    const { Z3 } = z3p
    // done on every snippet
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
    } catch (e) {
        // error with running z3
        error = e.message ?? "Error message is empty"
    } finally {
        Z3.del_context(ctx)
    }

    if (/unknown/.test(output)) {
        const timeEnd = new Date().getTime()
        if (timeEnd - timeStart >= timeout) {
            output = output + "\nZ3 timeout\n"
        }
    }

    // we are guaranteed to have non-undefined output and error
    if (!error) return output
    else
        return `error: ${error}

${output || ""}`
}

export default async function (_: ChatGenerationContext) {
    const { defTool } = _

    defTool(
        "z3",
        "Solves a SMTLIB2 problem using the Z3 constraint solver. Send problems one at a time. Use this tool if you need to run Z3.",
        {
            type: "object",
            properties: {
                smtlib2: {
                    type: "string",
                    description: "SMTLIB2 problem to solve",
                },
            },
            required: ["smtlib2"],
        },
        async (args) => {
            const { context, smtlib2 } = args
            dbg(`query: ${smtlib2}`)
            const result = await Z3Run(context, smtlib2)
            dbg(`result: ${result}`)
            return result
        }
    )
}
