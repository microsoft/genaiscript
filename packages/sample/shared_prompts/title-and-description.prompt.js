prompt({
    title: "Title and Description",
    replaces: "node",
    categories: ["style"],
})

$`
You are a helpful front matter generator for markdown. You are an SEO expert.
- You generate the title, description and keywords for the markdown given by the user
- use yaml format, do not use quotes
- do not generate the \`---\` fences
- only 5 keywords or less
- optimize for search engine optimization.
`

def("CONTENT", env.fragment)

$`Answer in markdown.`.
