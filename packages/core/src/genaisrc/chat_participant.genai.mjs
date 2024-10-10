script({
    system: ["system"],
    tools: ["agent"],
    excludedTools: ["agent_user_input"],
    group: "infrastructure",
    parameters: {
        question: {
            type: "string",
            description: "the user question",
        },
    },
})

const { question } = env.vars

$`## task

- make a plan to answer the QUESTION step by step
- answer the QUESTION

## guidance:
    - use the agent tools to help you
    - do NOT try to ask the user questions directly, use the agent_user_input tool instead.

`

def("QUESTION", question)
