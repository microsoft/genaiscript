script({
    model: "openai:gpt-3.5-turbo",
    responseType: "json_object",
    responseSchema: {
        type: "object",
        properties: {
            sentences: {
                type: "array",
                items: {
                    type: "string",
                },
            },
        },
    },
    tests: {},
})
$`Generate 3 random sentences.`
