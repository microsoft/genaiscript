script({
    title: "Chain of Debate Test",
    description: "Validates that the chain of debate implementation works correctly.",
    group: "Advanced Tests",
    temperature: 0,
    tests: [
        {
            files: [],
            vars: {
                question: "What is 2 + 2?",
                maxRounds: 2,
                models: ["openai:gpt-4o-mini", "openai:gpt-3.5-turbo"]
            },
            asserts: [
                {
                    type: "icontains",
                    value: "4",
                },
                {
                    type: "icontains", 
                    value: "FINAL ANSWER",
                }
            ],
        },
    ],
})

$`Test the chain of debate functionality with a simple math question.`