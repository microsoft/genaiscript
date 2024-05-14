script({
    title: "summary tool nested",
})
defTool(
    "summarize_file",
    "Summarize the content of FILE and save it in summary.txt",
    {
        filename: { type: "string" },
    },
    async (args) => {
        const { filename } = args
        const content = await workspace.readText(filename)
        const res = await runPrompt(
            (_) => {
                _.def("FILE", content)
                _.$`Summarize the content of FILE`
            },
            { model: "gpt-3.5-turbo" }
        )

        return res.text
    }
)

def("FILE", env.files.map((f) => f.filename).join("\n"), { maxTokens: 20000 })

$`Summarize the files of FILE and save it in summary.txt`
