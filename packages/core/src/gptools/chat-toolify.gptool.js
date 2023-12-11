gptool({
    title: "Convert chat to tool",
    description: "Attempts to capture the intent of the user and generate a tool from it.",
    copilot: true,
    system: ["system", "system.files", "system.summary"]
})

// use $ to output formatted text to the prompt
$`You are an expert LLM prompt engineer.
You will generate a script that generates a LLM promt 
that captures the intent of the user in CHAT.`

$`The tool is formatted in JavaScript and will be saved as a file named 'gptools/<toolname>.gptool.js'
where <toolname> is a short, descriptive, filename friendly name for the chat.`

$` The tool has access to these APIs:

\`\`\`typescript
/**
 * Setup prompt title and other parameters.
 * Exactly one call should be present on top of .gptool.js file.
 */
declare function gptool(options: {
    // human friendly name for the tool
    title: string
}): void

/**
 * Append given string to the prompt. It automatically appends "\n".
 */
declare function $(strings: TemplateStringsArray, ...args: any[]): string
\`\`\`

\`\`\`typescript file=gptools/<toolname>.gptool.js
A typical gptools file looks like this:

gptools({ title: <the title> })

$\`<the generated prompt from the user intent>\`
\`\`\`

To access files in the current context, insert this code in the script.

    def("SPEC", env.file)
    def("FILE", env.links)

`

$`
The CHAT is formatted as a markdown list of user messages.
`

// use def to emit and reference chunks of text
def("CHAT", env.chat.history.filter(m => m.role === "user")
    .map(({ role, content }) => `- ${content}`)
    .join("\n"), { language: "markdown" })
