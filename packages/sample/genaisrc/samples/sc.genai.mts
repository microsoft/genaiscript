script({
    title: "Spell checker",
    system: [
        "system.output_plaintext",
        "system.assistant",
        "system.files",
        "system.changelog",
        "system.safety_jailbreak",
        "system.safety_harmful_content",
    ],
    temperature: 0.2,
    cache: "sc",
})
const files = def("FILES", env.files[0], { })

$`Fix the spelling and grammar of the content of ${files}. Return the full file with corrections
If you find a spelling or grammar mistake, fix it. 
If you do not find any mistakes, respond <NO> and nothing else.

- only fix major errors
- use a technical documentation tone
- minimize changes; do NOT change the meaning of the content
- if the grammar is good enough, do NOT change it
- do NOT modify the frontmatter. THIS IS IMPORTANT.
- do NOT modify code regions. THIS IS IMPORTANT.
- do NOT fix \`code\` and \`\`\`code\`\`\` sections
- in .mdx files, do NOT fix inline typescript code
`
