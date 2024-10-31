script({
    title: "SEO front matter",
    description:
        "Update or generate SEO-optimized front matter for a markdown file.",
    group: "samples",
    system: ["system", "system.files"],
    maxTokens: 2000,
    temperature: 0,
    model: "large",
})

defFileMerge(function frontmatter(fn, label, before, generated) {
    if (!/\.mdx?$/i.test(fn)) return undefined
    const after = YAML.parse(generated)
    if (after.tag && !Array.isArray(after.tag)) delete after.tag
    const updated = MD.updateFrontmatter(before, {
        title: after.title,
        description: after.description,
        keywords: after.keywords,
    })
    return updated
})

def("FILE", env.files, { glob: "**.{md,mdx}" })

$`
You are a search engine optimization expert at creating front matter for markdown document.

For each FILE, generate the front matter content. DO NOT RESPOND the rest of the markdown content beyond the front matter.
ONLY generate the front matter section.
- Update fields title as needed
- Update description as needed 
- Update keywords as needed, only 5 keywords or less
- use yaml format, do not use quotes
- optimize for search engine optimization.
- Do NOT modify the markdown content after the front matter

If no front matter is present, generate it.
`
