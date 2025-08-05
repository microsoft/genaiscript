// Example: Using copilot instructions in your GenAI script

script({
    title: "Code Review with Copilot Instructions",
    description: "Reviews code using relevant GitHub Copilot instructions",
})

// Import the copilot instructions helper from runtime
import { importCopilotInstructions, formatCopilotInstructions } from "@genaiscript/runtime"

// Get copilot instructions that apply to the current files
const instructions = await importCopilotInstructions(env.files, {
    // Optional: include general copilot instructions even if no specific patterns match
    includeGeneral: true,
    // Optional: custom paths to search for instructions
    instructionPaths: [".github/instructions", ".github"],
    // Optional: custom patterns for instruction files  
    instructionPatterns: ["*.instructions.md", "copilot-instructions.md"],
})

if (instructions.length > 0) {
    // Format instructions for prompt inclusion
    const formattedInstructions = formatCopilotInstructions(instructions, {
        includeSourceInfo: true,  // Show which file each instruction comes from
        separator: "\n\n---\n\n", // Custom separator between instructions
    })
    
    $`# Code Review Instructions

${formattedInstructions}

# Files to Review

Please review the following files according to the instructions above:`

    // Add files to context with the instructions applied
    def("FILES", env.files, { 
        lineNumbers: true,
        ignoreEmpty: true 
    })

    $`

Provide constructive feedback following the coding standards and practices outlined in the instructions.`

} else {
    $`# Code Review

No specific coding instructions found. Please review the following files using general best practices:`

    def("FILES", env.files, { 
        lineNumbers: true,
        ignoreEmpty: true 
    })
}