script({ tests: {}, model: "openai:gpt-4o-mini" })
const res = await runPrompt(
    async (ctx) => {
        const poem = ctx.runPrompt(
            async (ctx2) => {
                const theme = ctx2.prompt`Pick a random poem theme`.options({
                    temperature: 1,
                    label: "theme",
                    model: "openai:gpt-4o-mini",
                })
                ctx2.$`Write a poen about ${theme}`
            },
            { label: "poem", model: "openai:gpt-4o-mini" }
        )
        ctx.$`Summarize this text: ${poem}`
    },
    { label: "summarize", model: "openai:gpt-4o-mini" }
)
if (!res.text) throw new Error("No text generated")
$`Generate a poem from ${res}`
