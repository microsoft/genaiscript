gptool({
    title: "SEO front matter",
    description: "Update or generate SEO-optimized front matter for a markdown file.",
    categories: ["markdown"],
    system: ["system", "system.diff"],
    maxTokens: 2000,
    temperature: 0,
})

def("SOURCE", env.links.filter(f => f.filename.endsWith(".md")))

$`
You are a helpful front matter generator. You are an SEO expert.

Generate DIFF for SOURCE front matter:
- Update fields title, description and keywords as needed
- use yaml format, do not use quotes
- only 5 keywords or less
- optimize for search engine optimization.
- Do not modify the markdown content after the front matter.

If no front matter is present, generate it.
`
