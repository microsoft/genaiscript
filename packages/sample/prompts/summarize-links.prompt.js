prompt({
    title: "Summarize links",
    replaces: "nothing",
})

$`
You are a export technical writer. Summarize the CONTENT below.
`

def(
    "CONTENT",
    Object.values(env.links)
        .map((f) => f.content)
        .join("\n\n")
)

$`Answer in markdown.`
