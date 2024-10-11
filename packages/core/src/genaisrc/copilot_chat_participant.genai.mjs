script({
    system: [
        "system",
        "system.tools",
        "system.files",
        "system.diagrams",
        "system.annotations",
        "system.git_info",
        "system.github_info",
        "system.safety_harmful_content",
    ],
    tools: ["agent"],
    group: "infrastructure",
    parameters: {
        question: {
            type: "string",
            description: "the user question",
        },
    },
    flexTokens: 20000,
})

const { question } = env.vars

$`## task

- make a plan to answer the QUESTION step by step
- answer the QUESTION

## guidance:
- use the agent tools to help you
- do NOT be lazy, always finish the tasks
- do NOT skip any steps
`

def("QUESTION", question)
def("FILE", env.files, { ignoreEmpty: true, flex: 1 })
