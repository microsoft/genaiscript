import prettier from "prettier"

script({
    title: "Source Code Comment Generator",
})

// Get files from environment or modified files from Git if none provided
let files = env.files
if (files.length === 0) {
    // If no files are provided, read all modified files
    files = await Promise.all(
        (await host.exec("git status --porcelain")).stdout
            .split("\n")
            .filter((filename) => /^ [M|U]/.test(filename))
            .map(
                async (filename) =>
                    await workspace.readText(filename.replace(/^ [M|U] /, ""))
            )
    )
}

// Process each file separately to avoid context explosion
for (const file of files) {
    console.log(`processing ${file.filename}`)
    try {
        // Normalize input content using prettier
        file.content = await prettify(file.filename, file.content)
        if (!file.content) continue
        // Add comments to the code using a generative AI
        let newContent = await addComments(file)
        // Apply prettier again to ensure format normalization
        newContent = await prettify(file.filename, newContent)
        // Save modified content if different
        if (file.content !== newContent) {
            console.log(`updating ${file.filename}`)
            await workspace.writeText(file.filename, newContent)
        }
    } catch (e) {
        console.error(`error: ${e}`)
    }
}

// Function to add comments to code
async function addComments(file: WorkspaceFile) {
    const res = await runPrompt(
        (ctx) => {
            // Define code snippet for AI context with line numbers
            const code = ctx.def("CODE", file, { lineNumbers: true })

            // AI prompt to add comments for better understanding
            ctx.$`You are tasked with adding comments to code in ${code} to make it more understandable for AI systems or human developers.
You should analyze it, and add/update appropriate comments as needed.

To add or update comments to this code, follow these steps:

1. Analyze the code to understand its structure and functionality.
- If you are not familiar with the programming language, ignore the file.
2. Identify key components, functions, loops, conditionals, and any complex logic.
3. Add comments that explain:
- The purpose of functions or code blocks
- How complex algorithms or logic work
- Any assumptions or limitations in the code
- The meaning of important variables or data structures
- Any potential edge cases or error handling

When adding or updating comments, follow these guidelines:

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
        },
        { system: ["system", "system.files"] }
    )
    const { text, fences } = res
    const newContent = fences?.[0]?.content ?? text
    if (!newContent) throw new Error("No content generated")
    return newContent
}

// Function to prettify code using prettier
async function prettify(filename: string, content: string) {
    const options = (await prettier.resolveConfig(filename)) ?? {}
    try {
        return await prettier.format(content, {
            ...options,
            filepath: filename,
        })
    } catch (e) {
        console.log(`prettier error: ${e}`)
        return undefined
    }
}
