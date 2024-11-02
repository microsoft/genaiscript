system({
    title: "Agent that can find, search or read files to accomplish tasks",
})

const model = env.vars.agentFsModel

defAgent(
    "fs",
    "query files to accomplish tasks",
    `Your are a helpfull LLM agent that can query the file system.
    Answer the question in QUERY.`,
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
