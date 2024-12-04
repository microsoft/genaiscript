script({
    description: "Model Context Protocol server demo",
    model: "small",
    tests: {},
})

await runPrompt((ctx) => {
    ctx.defTool({
        filesystem: {
            command: "npx",
            args: [
                "-y",
                "@modelcontextprotocol/server-filesystem",
                path.resolve("."),
            ],
        },
    })
    ctx.$`Write a poem about the file README.md`
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
