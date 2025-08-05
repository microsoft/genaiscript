script({
    title: "Test Copilot Instructions Import",
    description: "Demonstrates importing copilot instructions based on env.files",
})

// Import the copilot instructions functionality  
import { importCopilotInstructions, formatCopilotInstructions } from "../packages/runtime/dist/esm/copilotinstructions.js"

// Get relevant copilot instructions for the current env.files
const instructions = await importCopilotInstructions(workspace, env.files);

console.log(`Found ${instructions.length} relevant copilot instructions`)

for (const instruction of instructions) {
    console.log(`- ${instruction.filename}`)
    if (instruction.metadata?.applyTo) {
        console.log(`  Applies to: ${JSON.stringify(instruction.metadata.applyTo)}`)
    }
    if (instruction.metadata?.description) {
        console.log(`  Description: ${instruction.metadata.description}`)
    }
}

// Format the instructions for use in a prompt
if (instructions.length > 0) {
    const formattedInstructions = formatCopilotInstructions(instructions, {
        includeSourceInfo: true
    });
    
    $`## Copilot Instructions

${formattedInstructions}

## Task

Please analyze the following files and provide suggestions according to the instructions above.`

    // Add the files to the context
    def("FILES", env.files, { 
        lineNumbers: true,
        ignoreEmpty: true
    })
} else {
    $`No specific copilot instructions found for the selected files.`
}