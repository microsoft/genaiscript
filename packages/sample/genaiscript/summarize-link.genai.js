script({
    title: "summarize links",
    model: "gpt-4-32k",
    description: "Given a URL, summarize the contents of the page",
    categories: ["hello world"],
    system: ["system", "system.explanations", "system.files"],
    temperature: 0
})

for (const link of env.files.filter(file => file.filename.startsWith("https://"))) {
    const { file } = await fetchText(link)
    def("FILE", file)
}
$`Summarize FILE`
