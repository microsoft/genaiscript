system({
    title: "Agent that can query on the documentation.",
})

const docsRoot = env.vars.docsRoot || "docs"
const samplesRoot = env.vars.samplesRoot || "packages/sample/genaisrc/"

defAgent(
    "docs",
    "query the documentation",
    async (ctx) => {
        ctx.$`Your are a helpfull LLM agent that is an expert at Technical documentation. You can provide the best analyzis to any query about the documentation.

        Analyze QUERY and respond with the requested information.

        ## Tools

        The 'md_find_files' can perform a grep search over the documentation files and return the title, description, and filename for each match.
        To optimize search, conver the QUERY request into keywords or a regex pattern.

        Try multiple searches if you cannot find relevant files.
        
        ## Context

        - the documentation is stored in markdown/MDX files in the ${docsRoot} folder
        ${samplesRoot ? `- the code samples are stored in the ${samplesRoot} folder` : ""}
        `
    },
    {
        system: ["system.explanations", "system.github_info"],
        tools: [
            "md_find_files",
            "md_read_frontmatterm",
            "fs_find_files",
            "fs_read_file",
        ],
        maxTokens: 5000,
    }
)