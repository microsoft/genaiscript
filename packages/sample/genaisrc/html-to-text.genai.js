script({
    title: "HTML to Text"
})

const { text: html } = await fetchText("https://microsoft.github.io/genaiscript/getting-started/")
const text = parsers.HTMLToText(html)

const v = def("TEXT", text)

$`Summarize ${v}.`