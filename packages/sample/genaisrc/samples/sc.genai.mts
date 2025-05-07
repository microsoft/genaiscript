script({
    title: "Spell checker",
    system: ["system.output_plaintext", "system.assistant", "system.files"],
    responseType: "text",
    systemSafety: false,
    temperature: 0.2,
    cache: "sc",
    group: "mcp",
    parameters: {
        base: "",
    },
})
const { vars } = env
const base = vars.base || "HEAD~1"
console.debug(`base: ${base}`)
let files = env.files.length
    ? env.files
    : await git.listFiles("modified-base", { base })
files = files.filter((f) => /\.mdx?$/.test(f.filename))
console.debug(`files: ${files.map((f) => f.filename).join("\n")}`)

for (const file of files) {
    const { text, error } = await runPrompt(
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
        { label: file.filename }
    )
    if (!text || error || /<NO>/i.test(text)) continue
    await workspace.writeText(file.filename, text)
}
