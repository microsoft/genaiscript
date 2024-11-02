script({
    model: "small",
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
