script({
    model: "openai:gpt-3.5-turbo",
    title: "Multi-turn conversation",
    files: ["src/rag/markdown.md"],
    system: ["system", "system.files"],
    tests: {},
})


def("FILE", env.files)
$`Generate a set of questions for the files to build a FAQ.`


// turn 2
let turn = 0
defChatParticipant(
    async (ctx, messages) => {
        turn++
        if (turn <= 1) {
            const text = messages.at(-1).content
            const questions =
                text
                    ?.split("\n")
                    .map((q) => q.trim())
                    .filter((q) => q.length > 0) || []

            ctx.$`Here is the list of answers to the questions in the file. 
            
## Task 1:

Validate the quality of the answer.

## Task 2:

Write the question/answers pairs for each file in a "<filename>.qt.jsonl" file
using the JSONL format:

\`\`\`\`markdown
File: <filename>.qt.jsonl
\`\`\`
${JSONL.stringify([
                { q: "<question1>", a: "<answer1>" },
                { q: "<question2>", a: "<answer2>" }
            ])}
...
\`\`\`
\`\`\`\`

### Questions:
            `

            for (const question of questions) {
                const res = await runPrompt(
                    (_) => {
                        _.def("FILE", env.files)
                        _.def("QUESTION", question)
                        _.$`
## Roles
                
You are an expert educator at explaining concepts simply. 
                
## Task

Answer the QUESTION using the contents in FILE. 

## Instructions

- Use information in FILE exclusively.
- Be concise.
- Use simple language.
- use emojis.
`
                    },
                    { label: question }
                )

                ctx.$`
            
- question: ${question}`
                ctx.fence(res.text)
                ctx.$`\n\n`
            }
        }
    },
    { label: "answerer" }
)