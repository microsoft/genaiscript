script({
    model: "large",
    files: "src/edits/fibs/fib.*",
    system: ["system"],
    lineNumbers: true,
    tests: [
        {
            files: "src/edits/fibs/fib.*",
        },
        {
            files: "src/edits/bigfibs/fib.*",
        },
    ],
})
import { editTest } from "./fileedittest.mts"

$`## File edits

Use the 'file_edit' tool to update a file with new content. THIS IS IMPORTANT

`

editTest()

defTool(
    "file_edit",
    "Updates a file with new content. If the file is large, use lineStart and lineEnd in multiple tool calls to split the update into multiple parts THIS IS VERY IMPORTANT.",
    {
        type: "object",
        properties: {
            filename: {
                type: "string",
                description:
                    "The path of the file to update relative to the workspace root",
            },
            content: {
                type: "string",
                description:
                    "The new content to write to the file. Preserve white space.",
            },
            lineStart: {
                type: "number",
                description: "The line number to start the edit",
            },
            lineEnd: {
                type: "number",
                description: "The line number to end the edit",
            },
        },
        required: ["filename", "content"],
    },
    async (args) => {
        const { context, filename, content, lineStart, lineEnd } = args
        context.log(`${filename}#L${lineStart || ""}:${lineEnd || ""}`)
        context.log(content)
        return "ok"
    }
)
