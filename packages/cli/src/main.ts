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
*/
    const f = `[1] import re
[2] 
[3] def is_valid_email(email):
- [4]     if re.fullmatch(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", email):
+ [4]     pattern = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")
+ [5]     if pattern.fullmatch(email):
[6]         return True
[7]     else:
[8]         return False`
    const res = parseLLMDiffs(f)
    console.log(res)
}

main()
