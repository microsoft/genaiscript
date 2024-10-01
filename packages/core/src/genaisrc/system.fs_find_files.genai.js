system({
    title: "File find files",
    description: "Find files with glob and content regex.",
})

defTool(
    "fs_find_files",
    "Finds file matching a glob pattern. Use pattern to specify a regular expression to search for in the file content.",
    {
        type: "object",
        properties: {
            glob: {
                type: "string",
                description:
                    "Search path in glob format, including the relative path from the project root folder.",
            },
            pattern: {
                type: "string",
                description:
                    "Optional regular expression pattern to search for in the file content.",
            },
            frontmatter: {
                type: "boolean",
                description:
                    "If true, parse frontmatter in markdown files and return as YAML.",
            },
        },
        required: ["glob"],
    },
    async (args) => {
        const { glob, pattern, frontmatter, context } = args
        context.log(
            `ls ${glob} ${pattern ? `| grep ${pattern}` : ""} ${frontmatter ? "--frontmatter" : ""}`
        )
        const res = pattern
            ? (await workspace.grep(pattern, glob, { readText: false })).files
            : await workspace.findFiles(glob, { readText: false })
        if (!res?.length) return "No files found."

        if (frontmatter) {
            const files = []
            for (const { filename } of res) {
                const file = {
                    filename,
                }
                files.push(file)
                if (/\.mdx?$/i.test(filename)) {
                    try {
                        const content = await workspace.readText(filename)
                        const fm = await parsers.frontmatter(content)
                        if (fm) file.frontmatter = fm
                    } catch (e) {}
                }
            }
            const preview = files
                .map((f) =>
                    [f.filename, f.frontmatter?.title]
                        .filter((p) => !!p)
                        .join(", ")
                )
                .join("\n")
            context.log(preview)
            return YAML.stringify(files)
        } else {
            const filenames = res.map((f) => f.filename).join("\n")
            context.log(filenames)
            return filenames
        }
    }
)
