script({
    title: "Code Review with Copilot Instructions",
    description: "Reviews code using relevant GitHub Copilot instructions",
})

import { importCopilotInstructions } from "@genaiscript/runtime"

// Import instructions that apply to files and add to context
await importCopilotInstructions(env.files)

$`Please review the following files:`
def("FILES", env.files, { lineNumbers: true })