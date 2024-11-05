script({
    title: "Spell checker",
    parameters: {
        concurrency: {
            type: "number",
            description: "Number of concurrent jobs",
            default: 1,
        },
    },
})
const { concurrency } = env.vars

// Get files from environment or modified files from Git if none provided
let files = env.files
if (files.length === 0) {
    files = await git.listFiles("staged", {
        paths: ["*.md", "*.mdx"],
    })
    if (!files.length)
        files = await git.listFiles("modified-base", {
            paths: ["*.md", "*.mdx"],
        })
}

files = files.filter(({ filename }) => /.mdx?$/i.test(filename))
const jobs = host.promiseQueue(concurrency)
await jobs.mapAll(
    files,
    async (file) =>
        await runPrompt(
            (ctx) => {
                ctx.def("FILES", file)
                ctx.$`Analyze the spelling and grammar of the content of FILES.
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

                ctx.defFileOutput(files, "fixed markdown or mdx files")
            },
            {
                label: `spell check ${file.filename}`,
                model: "large",
                system: [
                    "system.assistant",
                    "system.files",
                    "system.changelog",
                    "system.safety_jailbreak",
                    "system.safety_harmful_content",
                ],
                temperature: 0.2,
                cache: "sc",
            }
        )
)
