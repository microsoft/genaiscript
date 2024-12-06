script({
    model: "small",
    system: ["system", "system.assistant", "system.tools"],
    tests: {
        keywords: [
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
    "llm-small",
    "Invokes small LLM (like gpt-4o-mini) to execute a LLM request",
    {
        prompt: {
            type: "string",
            description: "the prompt to be executed by the LLM",
            required: true,
        },
    },
    async ({ prompt }) => {
        const res = await env.generator.runPrompt(prompt, {
            model: "small",
            label: "llm-small",
        })
        return res.text
    }
)

defTool(
    "llm-large",
    "Invokes large LLM (like gpt-4o) to execute a LLM request",
    {
        prompt: {
            type: "string",
            description: "the prompt to be executed by the LLM",
            required: true,
        },
    },
    async ({ prompt }) => {
        const res = await env.generator.runPrompt(prompt, {
            model: "large",
            label: "llm-small",
        })
        return res.text
    }
)

$`You are a small LLM model.

Filter the list to only include rush albums released in the 1980's.

Sort the result from the previous task chronologically from oldest to newest.

Validate results.

Report as YAML list.

Let's solve this step by step. 
Use a small LLM for filter and sort options. 
Use a large LLM for validation.
`
