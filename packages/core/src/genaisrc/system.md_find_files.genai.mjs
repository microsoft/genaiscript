system({
    title: "Tools to help with documentation tasks",
})

const model = (env.vars.mdSummaryModel = "gpt-4o-mini")

defTool(
    "md_find_files",
    "Get the file structure of the documentation markdown/MDX files. Retursn filename, title, description for each match. Use pattern to specify a regular expression to search for in the file content.",
    {
        type: "object",
        properties: {
            path: {
                type: "string",
                description: "root path to search for markdown/MDX files",
            },
            pattern: {
                type: "string",
                description:
                    "regular expression pattern to search for in the file content.",
            },
            question: {
                type: "string",
                description: "Question to ask when computing the summary",
            },
        },
    },
    async (args) => {
        const { path, pattern, context, question } = args
        context.log(
            `docs: ls ${path} ${pattern ? `| grep ${pattern}` : ""} --frontmatter ${question ? `--ask ${question}` : ""}`
        )
        const matches = pattern
            ? (await workspace.grep(pattern, { path, readText: true })).files
            : await workspace.findFiles(path + "/**/*.{md,mdx}", {
                  readText: true,
              })
        if (!matches?.length) return "No files found."
        const q = await host.promiseQueue(5)
        const files = await q.mapAll(matches, async ({ filename, content }) => {
            const file = {
                filename,
            }
            try {
                const fm = await parsers.frontmatter(content)
                if (fm) {
                    file.title = fm.title
                    file.description = fm.description
                }
                const { text: summary } = await runPrompt(
                    (_) => {
                        _.def("CONTENT", content, { language: "markdown" })
                        _.$`As a professional summarizer, create a concise and comprehensive summary of the provided text, be it an article, post, conversation, or passage, while adhering to these guidelines:
                        ${question ? `* ${question}` : ""}
                        * The summary is intended for an LLM, not a human.
                        * Craft a summary that is detailed, thorough, in-depth, and complex, while maintaining clarity and conciseness.
                        * Incorporate main ideas and essential information, eliminating extraneous language and focusing on critical aspects.
                        * Rely strictly on the provided text, without including external information.
                        * Format the summary in one single paragraph form for easy understanding. Keep it short.
                        * Generate a list of keywords that are relevant to the text.`
                    },
                    {
                        label: `summarize ${filename}`,
                        cache: "md_find_files_summary",
                        model,
                    }
                )
                file.summary = summary
            } catch (e) {}
            return file
        })
        const res = YAML.stringify(files)
        return res
    },
    { maxTokens: 20000 }
)
