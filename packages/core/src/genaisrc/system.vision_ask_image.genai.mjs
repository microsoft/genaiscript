system({
    title: "Vision Ask Image",
    description:
        "Register tool that uses vision model to run a query on an image",
})

defTool(
    "vision_ask_image",
    "Use vision model to run a query on an image",
    {
        type: "object",
        properties: {
            image: {
                type: "string",
                description: "Image URL or workspace relative filepath",
            },
            query: {
                type: "string",
                description: "Query to run on the image",
            },
            hd: {
                type: "boolean",
                description: "Use high definition image",
            },
        },
        required: ["image", "query"],
    },
    async (args) => {
        const { image, query, hd } = args
        const res = await runPrompt(
            (_) => {
                _.defImages(image, {
                    autoCrop: true,
                    detail: hd ? "high" : "low",
                    maxWidth: hd ? 1024 : 512,
                    maxHeight: hd ? 1024 : 512,
                })
                _.$`Answer this query about the images:`
                _.def("QUERY", query)
            },
            {
                model: "vision",
                system: [
                    "system",
                    "system.assistant",
                    "system.safety_jailbreak",
                    "system.safety_harmful_content",
                ],
            }
        )
        return res
    }
)
