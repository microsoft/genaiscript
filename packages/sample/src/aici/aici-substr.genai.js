script({
    model: "aici:mixtral",
    title: "AICI test",
    system: [],
})

const file = env.files.filter((f) => f.filename.endsWith(".md"))[0]

def("DOCUMENT", file.content)

$`Question: According to DOCUMENT above, who created Markdown?\n`
$`Answer: ${AICI.gen({ maxTokens: 100, storeVar: "answer" })}\n\n`
$`Here is a short, exact quote from the DOCUMENT that supports the Answer: above: "${AICI.gen({ substring: file.content, maxTokens: 1000, storeVar: "quote" })}\n`
