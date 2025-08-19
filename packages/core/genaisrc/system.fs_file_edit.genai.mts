system({
    title: "File Edit",
    description: "Function to edit a file by splicing lines at a specific position.",
})

export default function (ctx: ChatGenerationContext) {
    const { defTool } = ctx

    defTool(
        "fs_file_edit",
        "Edits a file by splicing lines at a specific position. Similar to JavaScript's Array.splice() but for file lines. Removes a specified number of lines starting from a given line number and inserts new lines at that position.",
        {
            type: "object",
            properties: {
                filename: {
                    type: "string",
                    description:
                        "Path of the file to edit, relative to the workspace root. Must be within the workspace boundary.",
                },
                insertLine: {
                    type: "integer",
                    description:
                        "Line number (1-based) where to start the edit. Lines will be inserted at this position after removing deleteCount lines.",
                    minimum: 1,
                },
                deleteCount: {
                    type: "integer", 
                    description:
                        "Number of lines to delete starting from insertLine. Use 0 to insert without deleting.",
                    minimum: 0,
                    default: 0,
                },
                lines: {
                    type: "array",
                    items: {
                        type: "string",
                    },
                    description:
                        "Array of lines to insert at the specified position. Use empty array to only delete lines.",
                    default: [],
                },
            },
            required: ["filename", "insertLine"],
        },
        async (args) => {
            const { filename, insertLine, deleteCount = 0, lines = [], context } = args

            if (!filename) return "<MISSING>filename</MISSING>"
            if (insertLine < 1) return "<ERROR>insertLine must be >= 1</ERROR>"
            if (deleteCount < 0) return "<ERROR>deleteCount must be >= 0</ERROR>"

            try {
                context.log(`edit ${filename} at line ${insertLine}: delete ${deleteCount}, insert ${lines.length} lines`)

                // Read the current file content
                let fileContent: string
                try {
                    const result = await workspace.readText(filename)
                    fileContent = result.content ?? ""
                } catch (e) {
                    // If file doesn't exist and we're only inserting, create it
                    if (deleteCount === 0) {
                        fileContent = ""
                    } else {
                        return `<ERROR>File not found: ${filename}</ERROR>`
                    }
                }

                // Split content into lines
                const fileLines = fileContent.split(/\r?\n/)
                
                // Validate insertLine is within valid range for the file
                if (insertLine > fileLines.length + 1) {
                    return `<ERROR>insertLine ${insertLine} is beyond file length (${fileLines.length} lines)</ERROR>`
                }

                // Convert to 0-based index for splice operation
                const zeroBasedIndex = insertLine - 1

                // Validate deleteCount doesn't exceed available lines
                const availableLines = fileLines.length - zeroBasedIndex
                if (deleteCount > availableLines) {
                    return `<ERROR>deleteCount ${deleteCount} exceeds available lines ${availableLines} from line ${insertLine}</ERROR>`
                }

                // Perform the splice operation
                const deletedLines = fileLines.splice(zeroBasedIndex, deleteCount, ...lines)

                // Join the lines back into file content
                const newContent = fileLines.join("\n")

                // Write the updated content back to the file
                await workspace.writeText(filename, newContent)

                // Log the operation details
                const operation = []
                if (deleteCount > 0) {
                    operation.push(`deleted ${deleteCount} line${deleteCount === 1 ? '' : 's'}`)
                }
                if (lines.length > 0) {
                    operation.push(`inserted ${lines.length} line${lines.length === 1 ? '' : 's'}`)
                }
                
                const summary = operation.length > 0 ? operation.join(', ') : 'no changes'
                return `File ${filename} edited successfully at line ${insertLine}: ${summary}`

            } catch (e) {
                const error = e instanceof Error ? e.message : String(e)
                context.log(`Error editing ${filename}: ${error}`)
                return `<ERROR>Failed to edit file: ${error}</ERROR>`
            }
        },
        {
            maxTokens: 1000,
        }
    )
}