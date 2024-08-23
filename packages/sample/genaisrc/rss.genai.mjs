script({
    tests: {},
    system: ["system", "system.files"],
})

// channel / item[] / title, description
const { rss } = XML.parse(await (await fetch("https://dev.to/feed")).text())

defData(
    "ARTICLES",
    rss.channel.item.map(({ title, description }) => ({
        title,
        description: parsers.HTMLToText(description, {}).slice(0, 2000),
    }))
)
$`
- Summarize ARTICLES
- Extract 5 trending topics
- Save trends to file
`

defFileOutput(
    ".genaiscript/temp/devto-trends.txt",
    "The trending topics from ARTICLE. One trend per line as plaintext."
)
