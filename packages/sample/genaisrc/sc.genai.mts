script({
    title: "Spell checker",
    system: ["system", "system.files"],
})

const files = def("FILES", env.files, { endsWith: [".md", ".mdx"] })

$`Fix the spelling and gramme of the content of ${files}.

- do NOT fix the frontmatter
- do NOT fix code regions
- do NOT fix \`code\` and \`\`\`code\`\`\`
- in .mdx files, do NOT fix inline typescript code
`
