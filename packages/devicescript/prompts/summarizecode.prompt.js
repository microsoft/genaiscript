prompt({
    title: "Code Summarizer",
    description:
        "Given a source file in a programming language, extract the structure",
})

const { file } = await fetchText(env.vars.parameters?.["url"] || "")
def("FILE", file)

$`You are an expert at programming in all known languages.
For each FILE 'filename.extension', generate a summarized FILE 'filename.s.extension' that ignores the internal details
of the implementation and extracts enough information for an LLM to use the code elements
in the source file. Generate comments as needed.`
