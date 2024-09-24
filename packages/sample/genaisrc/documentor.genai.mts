// https://x.com/mckaywrigley/status/1838321570969981308
import prettier from "prettier"

script({
    system: ["system", "system.files"],
})

const files = env.files.filter(({ filename }) =>
    /\.(ts|js|py|cs|java)/i.test(filename)
)
const code = def("CODE", files, { lineNumbers: true })

$`You are tasked with adding comments to code in ${code} to make it more understandable for AI systems or human developers.
You should analyze it and add appropriate comments as needed.

To add comments to this code, follow these steps:

1. Analyze the code to understand its structure and functionality.
2. Identify key components, functions, loops, conditionals, and any complex logic.
3. Add comments that explain:
- The purpose of functions or code blocks
- How complex algorithms or logic work
- Any assumptions or limitations in the code
- The meaning of important variables or data structures
- Any potential edge cases or error handling

When adding comments, follow these guidelines:

- Use clear and concise language
- Avoid stating the obvious (e.g., don't just restate what the code does)
- Focus on the "why" and "how" rather than just the "what"
- Use single-line comments for brief explanations
- Use multi-line comments for longer explanations or function/class descriptions
- Always place comments above the code they refer to. do NOT place comments on the same line as code.
- If comments already exist, review and update them as needed.
- Minimize changes to existing comments.

Your output should be the original code with your added comments. Make sure to preserve the original code's formatting and structure. 

Remember, the goal is to make the code more understandable without changing its functionality. 
Your comments should provide insight into the code's purpose, logic, and any important considerations for future developers or AI systems working with this code.
`

defFileOutput(
    env.files.map(({ filename }) => filename),
    "Updated code with comments."
)
defOutputProcessor(async ({ fileEdits }) => {
    for (const [filepath, edit] of Object.entries(fileEdits)) {
        console.log(`formatting ${filepath}`)
        const options = (await prettier.resolveConfig(filepath)) ?? {}
        try {
            edit.after = await prettier.format(edit.after, {
                ...options,
                filepath,
            })
        } catch (e) {
            console.error(
                `prettier: error formatting ${filepath}: ${e.message}`
            )
            delete fileEdits[filepath]
        }
    }
})
