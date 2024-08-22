script({
    secrets: ["DEV_TO_API_KEY"],
})

const mds = env.files.filter(({ filename }) => filename.endsWith(".md"))
for (const file of mds) {
    console.log(`publishing ${file.filename}`)
    const fm = parsers.frontmatter(file)
    let md = /^---/.test(file.content)
        ? file.content.replace(/---\n[\s\S]*?---\n/, "")
        : file.content

    // patch dev.to markdown support
    md = md
        .replace(/\n```js title=.*\n/g, "\n```js\n")
        .replace(
            /\(\/genaiscript\//g,
            "(https://microsoft.github.io/genaiscript/"
        )
        .replace(
            "GenAIScript",
            "[GenAIScript](https://microsoft.github.io/genaiscript/)"
        )

    console.log(md)

    // https://developers.forem.com/api/v1#tag/articles/operation/createArticle
    const res = await fetch("https://dev.to/api/articles", {
        method: "POST",
        headers: {
            "content-type": "application/json",
            "api-key": env.secrets.DEV_TO_API_KEY,
        },
        body: JSON.stringify({
            article: {
                title: fm.title,
                description: fm.description,
                series: "GenAIScript",
                body_markdown: md,
                canonical_url: file.filename
                    .replace(
                        "docs/src/content/docs/",
                        "https://microsoft.github.io/genaisrc/"
                    )
                    .replace(/\.mdx?$/, "")
                    .replace(/\/index$/, ""),
                tags: fm.tags ?? fm.keywords,
                published: false,
            },
        }),
    })
    console.log(`status: ${res.status}`)
    if (!res.ok) throw new Error(res.statusText)
}
