script({
    title: "summarize-files-function",
    system: ["system", "system.fs_read_summary"],
    tests: {
        files: ["src/rag/*"],
        keywords: ["markdown", "lorem", "microsoft"],
    },
})

const files = def(
    "FILES",
    env.files.map(({ filename }) => `- ${filename}\n`).join()
)

$`Summarize the content of the ${files} in the file system. Keep it brief.`
