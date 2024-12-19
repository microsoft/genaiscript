script({
    responseSchema: {
        type: "object",
        properties: {
            keywords: {
                type: "array",
                items: {
                    type: "string",
                },
            },
        },
        required: ["keywords"],
    },
})

$`You are an expert document analyzer. 
Extract 5 keywords from the contents of <FILE>.`.role("system")
def("FILE", env.files)
