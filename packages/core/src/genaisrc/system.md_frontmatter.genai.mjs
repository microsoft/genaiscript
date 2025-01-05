system({
    title: "Markdown frontmatter reader",
    description:
        "Register tool that reads the frontmatter of a markdown or MDX file.",
})

export default function main(ctx) {
    ctx.defTool(
        "md_read_frontmatter",
        "Reads the frontmatter of a markdown or MDX file.",
        {
            type: "object",
            properties: {
                filename: {
                    type: "string",
                    description:
                        "Path of the markdown (.md) or MDX (.mdx) file to load, relative to the workspace.",
                },
            },
            required: ["filename"],
        },
        async ({ filename, context }) => {
            try {
                context.log(`cat ${filename} | frontmatter`)
                const res = await workspace.readText(filename)
                return parsers.frontmatter(res.content) ?? ""
            } catch (e) {
                return ""
            }
        }
    )
}
