script({
    title: "Spell checker",
    system: ["system", "system.files", "system.changelog"],
    temperature: 0.2,
})

// Get files from environment or modified files from Git if none provided
let files = env.files
if (files.length === 0) {
    files = await git.findModifiedFiles("staged", {
        paths: ["*.md", "*.mdx"],
    })
    if (!files.length)
        files = await git.findModifiedFiles("base", {
            paths: ["*.md", "*.mdx"],
        })
}
def("FILES", files, { endsWith: [".md", ".mdx"] })

$`Let's take a deep breadth and analyze the spelling and grammar of the content of FILES.
If you find a spelling or grammar mistake, fix it. Use CHANGELOG file format for small changes.
If you do not find any mistakes, do not change the content.

- only fix major errors
- use a technical documentation tone
- minimize changes; do NOT change the meaning of the content
- if the grammar is good enough, do NOT change it
- do NOT modify the frontmatter. THIS IS IMPORTANT.
- do NOT modify code regions. THIS IS IMPORTANT.
- do NOT fix \`code\` and \`\`\`code\`\`\` sections
- in .mdx files, do NOT fix inline typescript code
`

defFileOutput(files, "fixed markdown or mdx files")
