prompt({
    title: "Code Summarizer",
    model: "gpt-4-32k",
    maxTokens: 16000,
    description: "Given a source file in a programming language, extract the structure"
})

const urls = env.links.filter(f => /^https:\/\//.test(f.filename) && !/\.pdf$/.test(f.filename))
const files = await Promise.all(urls.map(async url => {
    const { file } = await fetchText(url)
    return file
}))
def("FILE", files)
def("SPEC", env.file)

$`You are an expert at programming in all known languages.
For each FILE 'filename.ts', generate the code structure in FILE 'filename.p.ts' 
that ignores the internal detailsof the implementation and extracts enough information for an LLM 
to use the code elements in the source file in the context of the SPEC task.
Do not generate a pseudo-file for SPEC.
`