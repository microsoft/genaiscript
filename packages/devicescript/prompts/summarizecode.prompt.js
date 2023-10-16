prompt({
    title: "Code Summarizer",
    description: "Given a source file in a programming language, extract the structure"
})

defFiles(env.links)

$`You are an expert at programming in all known languages.
For each FILE 'filename.extension', generate a summarized FILE 'filename.s.extension' that ignores the internal details
of the implementation and extracts enough information for an LLM to use the code elements
in the source file. Generate comments as needed.`