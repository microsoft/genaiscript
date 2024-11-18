script({
    model: "large",
    responseType: "json_schema",
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
})
$`Generate 3 random sentences!`
