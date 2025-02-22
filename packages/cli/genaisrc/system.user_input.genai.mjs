system({
    title: "Tools to ask questions to the user.",
})

defTool(
    "user_input_confirm",
    "Ask the user to confirm a message.",
    {
        type: "object",
        properties: {
            message: {
                type: "string",
                description: "Message to confirm",
            },
        },
        required: ["message"],
    },
    async (args) => {
        const { context, message } = args
        context.log(`user input confirm: ${message}`)
        return await host.confirm(message)
    }
)

defTool(
    "user_input_select",
    "Ask the user to select an option.",
    {
        type: "object",
        properties: {
            message: {
                type: "string",
                description: "Message to select",
            },
            options: {
                type: "array",
                description: "Options to select",
                items: {
                    type: "string",
                },
            },
        },
        required: ["message", "options"],
    },
    async (args) => {
        const { context, message, options } = args
        context.log(`user input select: ${message}`)
        return await host.select(message, options)
    }
)

defTool(
    "user_input_text",
    "Ask the user to input text.",
    {
        type: "object",
        properties: {
            message: {
                type: "string",
                description: "Message to input",
            },
        },
        required: ["message"],
    },
    async (args) => {
        const { context, message } = args
        context.log(`user input text: ${message}`)
        return await host.input(message)
    }
)
