script({
    description: "Model Context Protocol server demo",
    model: "small",
    tests: {},
})

defTool({
    memory: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-memory"],
    },
    filesystem: {
        command: "npx",
        args: [
            "-y",
            "@modelcontextprotocol/server-filesystem",
            path.resolve("."),
        ],
    },
})
$`Summarize the README.md file at the root of the workspace.`
