import { readFileSync, writeFileSync } from "fs"
import { tokenize } from "./jstokenizer"
import { getSubtasks } from "./refinement"

import {
    applyLLMDiff,
    extractFenced,
    parseLLMDiffs,
    parseProject,
    renderFencedVariables,
} from "coarch-core"
import { NodeHost } from "./hostimpl"

async function main() {
    NodeHost.install()

    const source = `
FILE:
\`\`\`\`\` file=gptools-wp.slides.md
### Slide 1: gptools Overview
\`\`\`\`\`

SUMMARY:
\`\`\`\`\`
Created a slidedeck in markdown format for the gptools content, including an overview, key components, workflow, AI-enhanced workflow process, and benefits.
\`\`\`\`\`   
            
    `
    const vars = extractFenced(source)
    console.log(renderFencedVariables(vars))
}

main()
