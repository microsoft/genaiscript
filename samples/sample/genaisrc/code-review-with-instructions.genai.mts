script({
    title: "Code Review with Copilot Instructions",
    description: "Reviews code using relevant GitHub Copilot instructions",
})

import { importCopilotInstructions } from "@genaiscript/runtime"

// Example 1: Manual usage - get instructions and format them yourself
const instructions = await importCopilotInstructions(env.files)

if (instructions?.length) {
    $`# Code Review Instructions

${instructions.map(inst => {
    let content = inst.content
    if (inst.metadata?.description) {
        content = `## ${inst.metadata.description}\n\n${content}`
    }
    return content
}).join('\n\n---\n\n')}

# Files to Review

Please review the following files according to the instructions above:`

    def("FILES", env.files, { lineNumbers: true })
} else {
    $`# Code Review

No specific instructions found. Please review the following files using general best practices:`
    
    def("FILES", env.files, { lineNumbers: true })
}

// Example 2: Automatic system prompt integration (alternative approach)
// await importCopilotInstructions(env.files, { generator: ctx })
// $`Please review the following files:`
// def("FILES", env.files, { lineNumbers: true })