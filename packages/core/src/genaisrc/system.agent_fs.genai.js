system({
    title: "Agent that can find, search or read files to accomplish tasks",
    parameters: {
        type: "object",
        properties: {
            model: {
                type: "string",
                description: "The model to use",
            },
        },
    },
})

const model = env.vars["system.agent_fs.model"]

defAgent(
    "fs",
    "query files to accomplish tasks",
    `Your are a helpful LLM agent that can query the file system.
    Answer the question in <QUERY>.`,
    {
        model,
        tools: [
            "fs_find_files",
            "fs_read_file",
            "fs_diff_files",
            "retrieval_fuzz_search",
            "md_frontmatter",
        ],
    }
)
