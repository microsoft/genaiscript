script({
    model: "openai:gpt-3.5-turbo",
    title: "Multi-turn conversation",
    files: ["src/rag/markdown.md"],
    system: ["system", "system.files"],
})

def("FILE", env.files)

let turn = 0
defChatParticipant(
    async (_, messages) => {
        turn++
        if (turn <= 1) {
            const text = messages.at(-1).content
            const questions =
                text
                    ?.split("\n")
                    .map((q) => q.trim())
                    .filter((q) => q.length > 0) || []

            _.$`Here is the list of answers to the questions in the file. 
            
## Task 1:

Validate the quality of the answer.

## Task 2:

Write the question/answers pairs for each file in a "<filename>.qt.txt" file
using the following format:

\`\`\`\`markdown
File: <filename>.qt.txt
\`\`\`
## <question>

<answer>
...
\`\`\`
\`\`\`\`


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

                _.$`
            
- question: ${question}`
                _.fence(res.text)
                _.$`\n\n`
            }
        }
    },
    { label: "answerer" }
)

$`Generate a set of questions for the files to build a FAQ. Format one line per question in text.`
