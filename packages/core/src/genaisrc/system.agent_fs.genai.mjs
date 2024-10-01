system({
    title: "Agent that can find, search or read files to accomplish tasks",
    parameters: {
        agentFsModel: {
            type: "string",
            description: "Model to use for the agent",
        },
    },
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
                - If you cannot answer the query, return an empty string.
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
                    "system.retrieval_fuzz_search",
                    "system.md_frontmatter",
                ],
            }
        )
        return res
    }
)
