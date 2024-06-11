defTool("search_files", "search files in the workspace", {
    type: "object",
    properties: {
        search: {
            type: "string",
            description: "Search string using glob patterns"
        }
    }
}, async args => {
    const { search} = args
    const files = await workspace.findFiles(search)
    return files.map(f => f.filename).join("\n")
})
defTool("read_file", "read the content of a file", {
    type: "object",
    properties: {
        file: {
            type: "string",
            description: "File path"
        }
    }
}, async args => {
    const { file } = args
    const content = await workspace.readText(file)
    return content.content
})

$`You are an expert at Azure Bicep and development of azure resources.

Generate a state graph of all recursively the .bicep files used in the workspace.Use mermaid.

- use more emojis
`

