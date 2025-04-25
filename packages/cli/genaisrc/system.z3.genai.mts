system({
    title: "Z3",
    description: "Solve constraints system using the Z3 constraint solver.",
})
const dbg = host.logger("system:z3")

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
            const { smtlib2 } = args
            dbg(`query: ${smtlib2}`)
            const z3 = await host.z3()
            const result = await z3.run(smtlib2)
            dbg(`result: ${result}`)
            return result
        }
    )
}
