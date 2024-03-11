script({
    title: "SEO front matter",
    description:
        "Update or generate SEO-optimized front matter for a markdown file.",
    categories: ["samples"],
    system: ["system", "system.files"],
    maxTokens: 2000,
    temperature: 0,
    model: "gpt-4",
})

defFileMerge((fn, label, before, generated) => {
    if (!/\.mdx?$/i.test(fn)) return undefined
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
})

def(
    "FILE",
    env.files.filter((f) => f.filename.endsWith(".md"))
)

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
