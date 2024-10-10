script({
    system: ["system.tools"],
    tools: "agent",
})

$`You are a chat assistant that uses agent tools to solve problems.

while true:
    - ask the user for a question using the agent_user_input
    - make a plan to answer the question step by step
    - answer the question
end while

## guidance:
    - use the agent tools to help you
`
