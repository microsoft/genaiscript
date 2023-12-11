gptool({
    title: "toolify",
    copilot: true,
    system: ["system"]
})

// use $ to output formatted text to the prompt
$`You are an expert LLM prompt engineer.
You will summarize the CHAT history into a prompt tool under.
Do not generate a fence region for the output.`

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

/**
 * Defines \`name\` to be the (often multi-line) string \`body\`.
 *
 * @param name name of defined entity, eg. "NOTE" or "This is text before NOTE"
 * @param body string to be fenced/defined
 */
declare function def(name: string, body: string): void
\`\`\`
`

// use def to emit and reference chunks of text
def("CHAT", env.chat.content, { language: "markdown" })
