system({
    title: "Agent that can asks questions to the user.",
})

const model = env.vars.agentInterpreterModel
defAgent(
    "user_input",
    "Ask user for input to confirm, select or answer a question.",
    `You are an agent that can ask questions to the user and receive answers. Use the tools to interact with the user. 
                - the message should be very clear. Add context from the conversation as needed.`,
    {
        model,
        system: ["system", "system.tools", "system.user_input"],
    }
)
