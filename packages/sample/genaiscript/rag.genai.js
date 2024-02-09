script({
    title: "rag",
})

// use $ to output formatted text to the prompt
$`You are a helpful assistant. Summarize the files.`

const res = await retreive("lorem ipsum", env.files)
// use def to emit LLM variables
def("FILE", res)
