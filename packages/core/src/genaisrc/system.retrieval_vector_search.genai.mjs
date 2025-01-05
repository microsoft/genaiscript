system({
    title: "Embeddings Vector Search",
    description:
        "Function to do a search using embeddings vector similarity distance.",
})

export default function main(ctx) {
    const embeddingsModel = ctx.env.vars.embeddingsModel || undefined

    ctx.defTool(
        "retrieval_vector_search",
        "Search files using embeddings and similarity distance.",
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
            const res = await retrieval.vectorSearch(
                q,
                files.map((filename) => ({ filename })),
                { embeddingsModel }
            )
            return YAML.stringify(res.map(({ filename }) => filename))
        }
    )
}
