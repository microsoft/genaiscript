script({
    title: "extract-quotes-AICI",
    model: "aici:mixtral",
    system: [],
})

// use def to emit LLM variables

const { file, pages } = await parsers.PDF(env.files[0])

def("FILE", file.content)

// use $ to output formatted text to the prompt
$`You are a helpful assistant.
Given the FILE, extract three exact quotes from the document
that could be used in a 1 paragraph press release that
would both give the audience an understanding of the
idea and make them want to learn more.

Quote 1: ${AICI.gen({ substring: file.content, maxTokens: 1000, storeVar: "quote1" })}
Quote 2: ${AICI.gen({ substring: file.content, maxTokens: 1000, storeVar: "quote2" })}
Quote 3: ${AICI.gen({ substring: file.content, maxTokens: 1000, storeVar: "quote3" })}
`  

