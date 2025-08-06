system({
    title: "File Write File",
    description: "Function to write text content to a file within the workspace.",
})

export default function (ctx: ChatGenerationContext) {
    const { defTool } = ctx

    defTool(
        "fs_write_file",
        "Writes text content to a file in the workspace. The file will be created if it doesn't exist, and parent directories will be created as needed. Only files within the current workspace are allowed to be written.",
        {
            type: "object",
            properties: {
                filename: {
                    type: "string",
                    description:
                        "Path of the file to write, relative to the workspace root. Must be within the workspace boundary.",
                },
                content: {
                    type: "string",
                    description:
                        "Text content to write to the file.",
                },
                append: {
                    type: "boolean",
                    description:
                        "If true, append content to the file instead of overwriting. Defaults to false.",
                    default: false,
                },
            },
            required: ["filename", "content"],
        },
        async (args) => {
            let {
                filename,
                content,
                append,
                context,
            } = args
            
            if (!filename) return "<MISSING>filename</MISSING>"
            if (content === undefined || content === null) return "<MISSING>content</MISSING>"
            
            try {
                context.log(
                    `${append ? "append" : "write"} ${filename}`
                )
                
                if (append) {
                    await workspace.appendText(filename, content)
                } else {
                    await workspace.writeText(filename, content)
                }
                
                return `File ${filename} ${append ? "appended" : "written"} successfully`
            } catch (e) {
                const error = e instanceof Error ? e.message : String(e)
                context.log(`Error writing to ${filename}: ${error}`)
                return `<ERROR>Failed to write file: ${error}</ERROR>`
            }
        },
        {
            maxTokens: 1000,
        }
    )
}