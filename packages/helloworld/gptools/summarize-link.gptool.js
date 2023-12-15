gptool({
    title: "summarize link",
    model: "gpt-4-32k",
    description: "Given a URL, summarize the contents of the page",
    categories: ["hello world"],
    system: ["system", "system.explanations", "system.files"],
    temperature: 0
})

const { text1, file } = await fetchText("https://www.microsoft.com/en-us/research/people/zorn/")
if (text1) $`And also ${text1}`

def("FILE", file)

$`Summarize FILE`
