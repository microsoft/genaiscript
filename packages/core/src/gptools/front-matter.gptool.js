gptool({
    title: "SEO front matter",
    description:
        "Update or generate SEO-optimized front matter for a markdown file.",
    categories: ["samples"],
    system: ["system", "system.diff", "system.summary"],
    maxTokens: 2000,
    temperature: 0,
    model: "gpt-4-32k",
    fileMerge: (label, before, generated) => {
        
    },
})

def(
    "FILE",
    env.links.filter((f) => f.filename.endsWith(".md")),
    { lineNumbers: true }
)

$`
You are a search engine optimization expert at creating front matter for markdown document.

Update or generate front matter in FILE:
- Update fields title as needed
- Update description as needed 
- Update keywords as needed, only 5 keywords or less
- use yaml format, do not use quotes
- optimize for search engine optimization.
- Do NOT modify the markdown content after the front matter

If no front matter is present, generate it.
`
