script({
    model: "openai:gpt-4",
    parameters: {
        topic: {
            type: "string",
            default: "ecology",
        },
    },
    tests: {
        files: ["src/rag/*.docx"],
    },
})
defTool(
    "reviewer",
    "An agent that reviews text for grammar and style.",
    {
        type: "object",
        properties: {
            text: {
                type: "string",
                description: "The text to summarize",
            },
        },
        required: ["text"],
    },
    async (args) => {
        const res = await runPrompt((_) => {
            const t = _.def("TEXT", args.text)
            _.$`You are an expert technical writer. Review ${t} and reports issues. 
            If the text good enough, return "OK"`
        })
        return res.text
    }
)

const topic = env.vars.topic

$`
## Step 1

Generate a technical description of the topic: ${topic}.

## Step 2

Ask the reviewer agent to review the text.

## Step 3

If the text is OK, proceed to the next step. 
Otherwise, follow the recommendations of the reviewer and apply the changes to the text,
then go back to Step 2.

## Step 4

Report the final text.

`
