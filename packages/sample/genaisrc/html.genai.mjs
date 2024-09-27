script({
    model: "openai:gpt-3.5-turbo",
    title: "HTML to Text",
    tests: {},
})

const { text: html } = await fetchText(
    "https://microsoft.github.io/genaiscript/getting-started/"
)
const text = await HTML.convertToText(html)
def("TEXT", text)

const md = await HTML.convertToMarkdown(html)
const v = def("MARKDOWN", md)

const tables = await HTML.convertTablesToJSON(html)
defData("TABLES", tables)

$`Compare TEXT and MARKDOWN.
Analyze the TABLES data.`
