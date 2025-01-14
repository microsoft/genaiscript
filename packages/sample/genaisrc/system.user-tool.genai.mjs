system({
    description: "An example of system script with tools",
})

defTool("my_random", "generate a random number", {}, async (args) => {
    return Math.random() + ""
})
