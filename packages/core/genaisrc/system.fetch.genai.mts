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
            skipToContent: {
                type: "string",
                description: "Skip to a specific string in the content.",
                required: false,
            },
        },
        async ({ context, ...args }) => {
            const { url, convert, skipToContent } = args as {
                url: string
                convert: FetchTextOptions["convert"]
                skipToContent: string
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
            if (!res.text) return res.file ?? res.status

            let result = res.text
            if (skipToContent) {
                const index = result.indexOf(skipToContent)
                if (index === -1)
                    return `error: skipTo '${skipToContent}' not found.`
                result = result.slice(index + skipToContent.length)
            }
            return result
        },
        {
            detectPromptInjection: "available",
        }
    )
}
