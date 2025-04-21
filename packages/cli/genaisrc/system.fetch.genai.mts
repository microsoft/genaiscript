system({
    title: "A tool that can fetch data from a URL",
    parameters: {
        domains: {
            type: "array",
            items: {
                type: "string",
                description: "A list of allowed domains to fetch data from.",
            },
        },
    },
})

export default function (ctx: ChatGenerationContext) {
    const { defTool, env } = ctx

    const dbg = host.logger(`system:fetch`)
    const domains = env.vars["system.fetch.domains"] || []
    dbg(`allowed domains: %o`, domains)

    defTool(
        "fetch",
        "Fetch data from a URL from allowed domains.",
        {
            url: {
                type: "string",
                description: "The URL to fetch data from.",
                required: true,
            },
            convert: {
                type: "string",
                description: "Converts HTML to Markdown or plain text.",
                required: false,
                enum: ["markdown", "text"],
            },
            ask: {
                type: "string",
                description:
                    "A LLM query to process and summarize the data content.",
                required: false,
            },
        },
        async ({ context, ...args }) => {
            const { url, convert, ask } = args as {
                url: string
                convert: FetchTextOptions["convert"]
                ask: string
            }
            const method = "GET"
            const uri = new URL(url)
            const domain = uri.hostname
            if (!domains.includes(domain))
                return `error: domain ${domain} is not allowed.`

            dbg(`${method} ${url}`)
            const res = await host.fetchText(url, { convert })
            dbg(`response: %d`, res.status)
            if (!res.ok) return `error: ${res.status}`
            if (!res.text) return res.file

            let result = res.text
            if (ask) {
                if (!convert) result = await HTML.convertToMarkdown(result)
                const resAsk = await runPrompt(
                    (_) => {
                        const askVar = _.def("QUESTION", ask)
                        const contentVar = _.def("CONTENT", result)
                        _.$`Analyze the content of ${contentVar} and generate a respond for the question in ${askVar}.
                        Your response is the output of a LLM tool.
                        - Use information from ${contentVar} exclusively to answer.
                        - If you cannot find the information in ${contentVar}, respond with 'I do not have enough information to answer the question.'`.role(
                            "system"
                        )
                    },
                    {
                        model: "summarize",
                        responseType: "text",
                        systemSafety: true,
                        label: `asking fetched data`,
                    }
                )
                if (!resAsk.error) result = resAsk.text
            }
            return result
        },
        {
            detectPromptInjection: "available",
        }
    )
}
