system({
    title: "Full Text Fuzzy Search",
    description: "Function to do a full text fuzz search.",
})

defTool(
    "retrieval_fuzz_search",
    "Search for keywords using the full text of files and a fuzzy distance.",
    {
        type: "object",
        properties: {
            files: {
                description: "array of file paths to search,",
                type: "array",
                items: {
                    type: "string",
                    description:
                        "path to the file to search, relative to the workspace root",
                },
            },
            q: {
                type: "string",
                description: "Search query.",
            },
        },
        required: ["q", "files"],
    },
    async (args) => {
        const { files, q } = args
        const res = await retrieval.fuzzSearch(
            q,
            files.map((filename) => ({ filename }))
        )
        return YAML.stringify(res.map(({ filename }) => filename))
    }
)
