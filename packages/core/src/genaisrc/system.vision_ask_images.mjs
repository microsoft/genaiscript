system({
    title: "Vision Ask Image",
    description:
        "Register tool that uses vision model to run a query on images",
})

defTool(
    "vision_ask_images",
    "Use vision model to run a query on multiple images",
    {
        type: "object",
        properties: {
            images: {
                type: "string",
                description:
                    "Images URL or workspace relative filepaths. One image per line.",
            },
            extra: {
                type: "string",
                description: "Additional context information about the images",
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
        const { context, images, extra, query, hd } = args
        const imgs = images.split(/\r?\n/g).filter((f) => !!f)
        context.debug(imgs.join("\n"))
        const res = await runPrompt(
            (_) => {
                _.defImages(imgs, {
                    autoCrop: true,
                    detail: hd ? "high" : "low",
                    maxWidth: hd ? 1024 : 512,
                    maxHeight: hd ? 1024 : 512,
                })
                if (extra) _.def("EXTRA_CONTEXT", extra)
                _.$`Answer the <Query> about the images.`
                if (extra)
                    $`Use the extra context provided in <EXTRA_CONTEXT> to help you.`
                _.def("QUERY", query)
            },
            {
                model: "vision",
                cache: "vision_ask_images",
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
