// Simple test script for quiet mode with runPrompt
script({
    title: "Test Quiet Mode with runPrompt",
    description: "Tests if runPrompt respects quiet mode"
})

console.log("Starting test script...")

const result = await runPrompt(
    (_) => {
        _.console.log("This is a console.log from within runPrompt")
        _.console.debug("This is a console.debug from within runPrompt")
        _.$`Generate a short response about the color blue.`
    },
    { 
        model: "openai:gpt-4",
        label: "test-inner-prompt"
    }
)

console.log("Inner prompt result:", result.text)
console.log("Test script completed.")