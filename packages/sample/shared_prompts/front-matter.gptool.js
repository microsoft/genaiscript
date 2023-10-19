prompt({
    title: "Title and Description",
    categories: ["style"],
    system: []
})

$`
You are a helpful front matter generator. You are an SEO expert.
`

def("SOURCE", env.file)

$`Update or generate the front matter in SOURCE. Minimize changes.`
$`- Update fields title, description and keywords
- use yaml format, do not use quotes
- only 5 keywords or less
- optimize for search engine optimization.
- Do not modify the markdown content after the front matter.`
