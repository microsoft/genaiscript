const rx = /!\[\]\(([^\)]+\.(png|jpg))\)/g
const { files } = await workspace.grep(rx, "**.{md,mdx}", { readText: true })
console.log(`found ${files.length} files`)

// collect urls to fix
const imgs: Record<string, string> = {}
for (const file of files) {
    const { filename, content } = file
    console.log(`. ${filename}`)
    const matches = content.matchAll(rx)
    // pre-compute matches
    for (const match of matches) {
        const murl = match[1]
        if (!imgs[murl]) {
            const url = /^\//.test(murl)
                ? path.join(`./slides/public`, murl.slice(1))
                : murl
            console.log(`.. ${url}`)
            const { text, error } = await runPrompt(
                (_) => {
                    _.defImages(url)
                    _.$`You are an expert in assistive technology. You will analyze each image 
and generate a description alt text for the image.
- Do not include Alt text in the description.`
                },
                {
                    system: [],
                    model: "openai:gpt-4-turbo-v",
                    maxTokens: 4000,
                    temperature: 0.5,
                    cache: "alt-text",
                }
            )
            if (error) console.error(error.message)
            else imgs[murl] = text
        }
    }
    // apply replacements
    const newContent = content.replace(
        rx,
        (m, url) => `![${imgs[url] ?? ""}](${url})`
    )
    // save file
    await workspace.writeText(filename, newContent)
}
