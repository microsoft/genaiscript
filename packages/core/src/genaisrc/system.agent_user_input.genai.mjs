system({
    title: "Agent that can asks questions to the user.",
})

export default function main(ctx) {
    const model = ctx.env.vars.agentInterpreterModel
    ctx.defAgent(
        "user_input",
        "ask user for input to confirm, select or answer the question in the query. The message should be very clear and provide all the context.",
        `Your task is to ask the question in QUERY to the user using the tools.
    - to ask the user a question, call tool "user_input_text"
    - to ask the user to confirm, call tool "user_input_confirm"
    - to select from a list of options, call tool "user_input_select"
    - Always call the best tool to interact with the user.
    - do NOT try to interpret the meaning of the question, let the user answer.
    - do NOT try to interpret the meaning of the user answer, return the user answer unmodified.`,
        {
            model,
            tools: ["user_input"],
        }
    )
}
