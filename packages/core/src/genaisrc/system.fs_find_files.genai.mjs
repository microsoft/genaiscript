system({
    title: "File find files",
    description: "Find files with glob and content regex.",
})

const findFilesCount = env.vars.fsFindFilesCount || 64

defTool(
    "fs_find_files",
    "Finds file matching a glob pattern. Use pattern to specify a regular expression to search for in the file content. Be careful about asking too many files.",
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
            count: {
                type: "number",
                description:
                    "Number of files to return. Default is 20 maximum.",
            },
        },
        required: ["glob"],
    },
    async (args) => {
        const {
            glob,
            pattern,
            frontmatter,
            context,
            count = findFilesCount,
        } = args
        context.log(
            `ls ${glob} ${pattern ? `| grep ${pattern}` : ""} ${frontmatter ? "--frontmatter" : ""}`
        )
        let res = pattern
            ? (await workspace.grep(pattern, { glob, readText: false })).files
            : await workspace.findFiles(glob, { readText: false })
        if (!res?.length) return "No files found."

        let suffix = ""
        if (res.length > findFilesCount) {
            res = res.slice(0, findFilesCount)
            suffix =
                "\n<too many files found. Showing first 100. Use 'count' to specify how many and/or use 'pattern' to do a grep search>"
        }

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
            return YAML.stringify(files) + suffix
        } else {
            const filenames = res.map((f) => f.filename).join("\n") + suffix
            context.log(filenames)
            return filenames
        }
    }
)
