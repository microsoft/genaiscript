script({
    model: "echo",
    accept: "none",
    group: "commit",
    tests: {},
    parameters: {
        name: {
            type: "string",
            uiSuggestions: ["A", "B"],
        },
        categories: {
            type: "string",
            enum: ["A", "B", "C"],
        },
    },
})

env.output.itemValue("name", env.vars.name)
env.output.itemValue("categories", env.vars.categories)
