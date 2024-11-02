script({
    title: "summarize-files-function",
    tools: ["fs"],
    model: "small",
    tests: {
        files: ["src/rag/*"],
        keywords: ["markdown", "lorem", "word"],
    },
    vars: {
        "system.fs_read_summary.model": "ollama:phi3",
    },
})

const files = def(
    "FILES",
    env.files.map(({ filename }) => `- ${filename}\n`).join()
)

$`Summarize the content of the ${files} in the file system. Keep it brief.`
