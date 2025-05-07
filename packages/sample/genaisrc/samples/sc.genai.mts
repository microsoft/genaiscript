script({
    title: "Spell checker",
    system: ["system.output_plaintext", "system.assistant", "system.files"],
    responseType: "text",
    systemSafety: false,
    temperature: 0.2,
    cache: "sc",
    group: "mcp",
})
const { dbg } = env

let files = env.files.length
    ? env.files
    : await git.listFiles("modified-base", { base: "dev" })
files = files.filter((f) => /\.mdx?$/.test(f.filename))

for (const file of files) {
    const { text } = await runPrompt(
        (ctx) => {
            const fileRef = ctx.def("FILES", file)
            ctx.$`Fix the spelling and grammar of the content of ${fileRef}. Return the full file with corrections
If you find a spelling or grammar mistake, fix it. 
If you do not find any mistakes, respond <NO> and nothing else.

- only fix major errors
- use a technical documentation tone
- minimize changes; do NOT change the meaning of the content
- if the grammar is good enough, do NOT change it
- do NOT modify the frontmatter. THIS IS IMPORTANT.
- do NOT modify code regions. THIS IS IMPORTANT.
- do NOT modify URLs
- do NOT fix \`code\` and \`\`\`code\`\`\` sections
- in .mdx files, do NOT fix inline typescript code
`
        },
        { label: file.filename, throwOnError: true }
    )
    if (!text || /<NO>/i.test(text)) continue
    await workspace.writeText(file.filename, text)
}
