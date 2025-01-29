script({
    model: "small",
    responseType: "yaml",
    responseSchema: {
        type: "object",
        properties: {
            keywords: {
                type: "array",
                maxItems: 5,
                items: {
                    type: "string",
                    description: "A keyword",
                },
            },
        },
        required: ["keywords"],
    },
})
def("SOURCE", env.files)
$`You are an expert an analyzing documetation. Extract keywords from <SOURCE>. At most 5 keywords are expected.`
