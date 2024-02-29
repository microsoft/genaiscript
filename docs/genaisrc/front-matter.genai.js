script({
    title: "SEO front matter",
    description:
        "Update or generate SEO-optimized front matter for a markdown file.",
    categories: ["samples"],
    system: ["system", "system.files"],
    maxTokens: 2000,
    temperature: 0,
    model: "gpt-4",
    fileMerge: (label, before, generated) => {
        let start = 0,
            end = 0
        const lines = (before || "").split("\n")
        if (lines[0] === "---") end = lines.indexOf("---", 1)
        let gstart = 0,
            gend = 0
        const glines = generated.split("\n")
        if (glines[0] === "---") gend = glines.indexOf("---", 1)
        if (gend > 0) {
            const res = lines.slice(0)
            res.splice(start, end - start, ...glines.slice(gstart, gend))
            return res.join("\n")
        }
        return before
    },
})

def(
    "FILE",
    env.files.filter((f) => f.filename.endsWith(".md"))
)

$`
You are a search engine optimization expert at creating front matter for markdown document.

For each FILE, generate the front matter content. 

## Guidance

- ONLY generate the front matter section. This is important.

- Update fields title as needed. Keep title VERY short (one word best) so that it fits in the table of contents.
- Update description as needed.
- Update keywords as needed, only 5 keywords or less.
- use yaml format, do not use quotes
- optimize for search engine optimization.
- If no front matter is present, generate it.

## Things to avoid

- DO NOT RESPOND the rest of the markdown content beyond the front matter.
- Do NOT modify the markdown content after the front matter
- Do NOT repeat project name (GenAIScript) in 'title' field
- If a title is already present, do not modify unless necessary.
- Do NOT use 'Guide' in title.
`
