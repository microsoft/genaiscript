script({
    model: "openai:gpt-4o",
    tests: {
        keywords: [
            "Permanent Waves",
            "Moving Pictures",
            "Signals",
            "Power Windows",
        ],
    },
})
// https://github.com/Stevenic/agentm-js/blob/main/examples/filter-discography.ts
const rushAlbums = [
    "Grace Under Pressure",
    "Hemispheres",
    "Permanent Waves",
    "Presto",
    "Clockwork Angels",
    "Roll the Bones",
    "Signals",
    "Rush",
    "Power Windows",
    "Fly by Night",
    "A Farewell to Kings",
    "2112",
    "Snakes & Arrows",
    "Test for Echo",
    "Caress of Steel",
    "Moving Pictures",
    "Counterparts",
    "Vapor Trails",
    "Hold Your Fire",
]

defData("RUSH_ALBUMS", rushAlbums)

defTool(
    "llm-gpt35",
    "Invokes gpt-3.5-turbo to execute a LLM request",
    {
        prompt: {
            type: "string",
            description: "the prompt to be executed by the LLM",
        },
    },
    async ({ prompt }) => {
        const res = await env.generator.runPrompt(prompt, {
            model: "openai:gpt-3.5-turbo",
            label: "llm-gpt35",
        })
        return res.text
    }
)

defTool(
    "llm-4o",
    "Invokes gpt-4o to execute a LLM request",
    {
        prompt: {
            type: "string",
            description: "the prompt to be executed by the LLM",
        },
    },
    async ({ prompt }) => {
        const res = await env.generator.runPrompt(prompt, {
            model: "openai:gpt-4o",
            label: "llm-4o",
        })
        return res.text
    }
)

$`
Filter the list to only include rush albums released in the 1980's.

Sort the result from the previous task chronologically from oldest to newest.

Validate results.

Report as YAML list.

Let's solve this step by step. 
Use gpt-3.5 for filter and sort options. 
Use gpt-4o for validation.
`
