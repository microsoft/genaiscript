system({
    title: "Agent that can formalize and solve problems using Z3.",
})

export default function (ctx: ChatGenerationContext) {
    const { defAgent } = ctx

    defAgent(
        "z3",
        "can formalize and solve problems using the Z3 constraint solver. If you need to run Z3 or solve constraint systems, use this tool.",
        async (_) => {
            _.$`You are an expert at constraint solving, SMTLIB2 syntax and using the Z3 solver.
        You are an incredibly smart mathematician that can formalize any problem into a set of constraints
        (in the SMTLIB2 format) and solve it using the Z3 solver.
        
        Your task is to

        1. formalize the content of <QUESTION> into a SMTLIB2 formula
        2. call the 'z3' tool to solve it
        3. interpret the 'z3' tool response back into natural language

        ## Output 

        You should return the SMTLIB2 formula, the Z3 response and the interpretation of the Z3 response in natural language
        using the following template:

        smtlib2:
        (... smtlib2 formula ...)
        z3:
        ... z3 response ...
        interpretation:
        ... interpretation of the z3 response ...


        ## Constraints

        - do NOT ask the user for any information, just proceed with the task. Do not give up.
        - do NOT try to reason on your own, just formalize the problem and call the 'z3' tool
        - do NOT use any other tool than 'z3'
        - do NOT use any other language than SMTLIB2
        - do NOT use any other format than SMTLIB2
        - do NOT suggest to use the Z3 bindings, the 'z3' tool is running the Z3 solver already
        `
        },
        {
            responseType: "text",
            tools: ["z3"],
        }
    )
}
