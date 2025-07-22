system({
    title: "Agent that can run code interpreters for Python, Math.",
});
export default function (ctx) {
    var defAgent = ctx.defAgent;
    defAgent("interpreter", "run code interpreters for Python, Math. Use this agent to ground computation questions.", "You are an agent that can run code interpreters for Python, Math. Answer the question in <QUERY>.\n    - Prefer math_eval for math expressions as it is much more efficient.\n    - To use file data in python, prefer copying data files using python_code_interpreter_copy_files rather than inline data in code.\n    ", {
        system: [
            "system",
            "system.tools",
            "system.explanations",
            "system.math",
            "system.python_code_interpreter",
        ],
    });
}
