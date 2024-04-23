script({
    title: "summarize-files-function",
    system: ["system", "system.fs_read_summary"]
})

const files = def("FILES", env.files.map(({ filename }) => `- ${filename}\n`).join())

$`Summarize the content of the ${files} in the file system. Keep it brief.`