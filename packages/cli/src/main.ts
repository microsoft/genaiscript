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
    /*
    const source = `
FILE:
\`\`\`\`\` file=gptools-wp.slides.md
### Slide 1: gptools Overview
\`\`\`\`\`

FILE: gptools-wp2.slides
\`\`\`\`\`
### Slide 1: gptools Overview
\`\`\`\`\`

FILE gptools-wp2.slides.md:
\`\`\`\`\`
### Slide 2: gptools Overview
\`\`\`\`\`

SUMMARY:
\`\`\`\`\`
Created a slidedeck in markdown format for the gptools content, including an overview, key components, workflow, AI-enhanced workflow process, and benefits.
\`\`\`\`\`   
            
    `
    const vars = extractFenced(source)
    console.log(renderFencedVariables(vars))

    const source = `[1] import re
[2] 
[3] def is_valid_email(email):
- [4]     if re.fullmatch(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", email):
+ [4]     pattern = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")
+ [5]     if pattern.fullmatch(email):
[6]         return True
[7]     else:
[8]         return False`
*/
    const source = `+ ---
+ title: gptools: Empowering Human Workflows with AI-Enhanced Tools
+ description: An overview of gptools, a framework that empowers teams to create and use AI-enhanced scripts to support their workflows.
+ keywords: gptools, AI-enhanced scripts, workflow automation, foundation models, LLMs
+ ---
[1] # gptools: Empowering Human Workflows with AI-Enhanced Tools
[2] 
[3] -   Authors: Peli de Halleux, Michał Moskal, Ben Zorn
[4] -   Date: October 2023
[5] -   Repository: [gptools](https://github.com/microsoft/gptools/tree/main)
[6] 
[7] ## Abstract`
    const res = parseLLMDiffs(source)
    console.log(res)
}

main()
