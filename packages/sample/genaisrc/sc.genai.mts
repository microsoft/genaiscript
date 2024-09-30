script({
    title: "Spell checker",
    system: ["system", "system.files", "system.diff"],
    temperature: 0.1,
})

// Get files from environment or modified files from Git if none provided
let files = env.files
if (files.length === 0) {
    // If no files are provided, read all modified files
    const gitStatus = await host.exec("git status --porcelain")
    const rx = /^\s+[M|U]\s+/ // modified or untracked
    files = await Promise.all(
        gitStatus.stdout
            .split(/\r?\n/g)
            .filter((filename) => rx.test(filename))
            .filter((filename) => /\.(md|mdx)$/.test(filename))
            .map(
                async (filename) =>
                    await workspace.readText(filename.replace(rx, ""))
            )
    )
}
def("FILES", files, { endsWith: [".md", ".mdx"] })

$`Fix the spelling and gramme of the content of FILES. Use diff format for small changes.

- do NOT fix the frontmatter
- do NOT fix code regions
- do NOT fix \`code\` and \`\`\`code\`\`\`
- in .mdx files, do NOT fix inline typescript code
`

defFileOutput(files, "fixed markdown or mdx files")
