script({
    // fenceFormat: "xml"
    system: [],
})
const t = def(
    "doc_to_translate",
    "Markdown is a lightweight markup language that you can use to add formatting elements to plaintext text documents. Created by John Gruber in 2004, Markdown is now one of the world’s most popular markup languages.",
    { maxTokens: 10 }
)

$`Translate the content of ${t} to french. Respond with the translated text only.`
