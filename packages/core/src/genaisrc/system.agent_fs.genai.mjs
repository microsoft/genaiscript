system({
    title: "Agent that can find, search or read files to accomplish tasks",
})

const model = env.vars.agentFsModel

defTool(
    "agent_fs",
    "Agent that can query files to accomplish tasks",
    {
        query: {
            type: "string",
            description: "Query to answer",
        },
    },
    async (args) => {
        const { context, query } = args
        context.log(`agent fs: ${query}`)
        const res = await runPrompt(
            (_) => {
                _.def("QUERY", query)

                _.$`Your are a helpfull LLM agent that can query the file system to accomplish tasks. 
                
                Analyze and answer QUERY.
                
                - Assume that your answer will be analyzed by an LLM, not a human.
                - If you are missing information, reply "MISSING_INFO: <what is missing>".
                - If you cannot answer the query, return "NO_ANSWER: <reason>".
                `
            },
            {
                model,
                system: [
                    "system",
                    "system.tools",
                    "system.explanations",
                    "system.fs_find_files",
                    "system.fs_read_file",
                    "system.fs_diff_files",
                    "system.retrieval_fuzz_search",
                    "system.md_frontmatter",
                ],
                label: "agent file system",
            }
        )
        return res
    }
)
