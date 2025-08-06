// Example usage of importChatModeInstructions function
script({
  title: "Example: Import Chat Mode Instructions",
  description: "Demonstrates how to import VSCode chat mode instruction files into system prompt",
  model: "echo" // Use echo model for testing
})

// Import default chat mode instruction files
// This will search for common patterns like:
// - .github/copilot-instructions.md
// - .vscode/copilot-instructions.md  
// - copilot-instructions.md
// etc.
importChatModeInstructions()

// You can also specify custom patterns
// importChatModeInstructions([".github/my-custom-instructions.md"])

$`Please summarize what the imported instructions contain.`