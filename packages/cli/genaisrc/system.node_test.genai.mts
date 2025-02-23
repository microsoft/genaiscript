system({
    title: "Tools to run node.js test script",
})

defTool(
    "node_test",
    "build and test current project using `npm test`",
    {
        path: {
            type: "string",
            description:
                "Path to the package folder relative to the workspace root",
        },
    },
    async (args) => {
        return await host.exec("npm", ["test"], { cwd: args.path })
    }
)
