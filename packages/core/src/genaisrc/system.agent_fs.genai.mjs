system({
    title: "Agent that can find, search or read files to accomplish tasks",
})

export default function main(ctx) {
    const model = ctx.env.vars.agentFsModel
    ctx.defAgent(
        "fs",
        "query files to accomplish tasks",
        `Your are a helpful LLM agent that can query the file system.
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
}
