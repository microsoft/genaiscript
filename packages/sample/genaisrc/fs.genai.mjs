sc ript({
    model: "openai:gpt-3.5-turbo",
    tools: ["fs"],
    tests: {},
})

$`List the cities in the src folder markdown files as a CSV table. The file should contain the word "city".`
