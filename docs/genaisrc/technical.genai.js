script({
    title: "Technical proofreading",
    description: "Review the text as a technical document writer.",
    categories: ["samples"],
    temperature: 0,
})

def("FILE", env.files, { lineNumbers: true })

$`You are a helpful expert writer at technical documentation.
You are reviewing and updating FILE using the diff format to fix grammatical errors, 
fix spelling errors and make it sound technical.

- Do NOT modify the languate type in code fence regions (like "\`\`\`md").
- Do NOT modify \`\`\`sh for \`\`\`bash, \`\`\`js for \`\`\`javascript
- Do NOT modify the frontmatter.
- Do NOT modify URLs.
- Do NOT modify code blocks.
`
