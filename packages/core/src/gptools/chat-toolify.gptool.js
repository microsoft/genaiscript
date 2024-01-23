gptool({
    title: "Convert chat to tool",
    description: "Attempts to capture the intent of the user and generate a tool from it.",
    copilot: true,
    system: ["system", "system.files", "system.summary"],
    categories: ["chat"],
    chat: true
})

// use $ to output formatted text to the prompt
$`You are an expert LLM prompt engineer.
You will generate a tool script that generates a LLM prompt
that captures the intent of the user in CHAT_HISTORY.`

$`The generated tool source is JavaScript and will be saved as a file named 'gptools/<toolname>.gptool.js'
where <toolname> is a short, descriptive, filename friendly name for the CHAT_HISTORY.`

$` The tool has access to these APIs:

\`\`\`js
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

/**
 * Define a variable with the content of files.
 */
declare function def(name: string, files: LinkedFile[]): void
\`\`\`

A typical gptools file looks like this.

\`\`\`js file=gptools/<toolname>.gptool.js
gptools({ title: <the title> })

// FILE is a special variable that points to files in context.
def("FILE", env.links)

$\`<the generated prompt from the user intent>\`
\`\`\`
`


// use def to emit and reference chunks of text
def("CHAT_HISTORY", env.chat.history
    .map(({ role, content }) => `- [${role}] ${content}\n`)
    .join("\n"), { language: "markdown" })

