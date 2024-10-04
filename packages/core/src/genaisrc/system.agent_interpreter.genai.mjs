system({
    title: "Agent that can run code interpreters for Python, Math.",
})

const model = env.vars.agentInterpreterModel
defAgent(
    "interpreter",
    "Run code interpreters for Python, Math. Use this agent to ground computation questions.",
    `You are an agent that can run code interpreters for Python, Math. 
    - Prefer math_eval for math expressions as it is much more efficient.
    - To use file data in python, prefer copying data files using python_code_interpreter_copy_files rather than inline data in code.
    `,
    {
        model,
        system: [
            "system",
            "system.tools",
            "system.explanations",
            "system.math",
            "system.python_code_interpreter",
        ],
    }
)
