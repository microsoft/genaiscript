script({
    model: "large",
    system: [
        // List of system components and tools available for the script
        "system",
        "system.safety_harmful_content",
        "system.safety_jailbreak",
        "system.safety_protected_material",
        "system.tools",
        "system.files",
        "system.files_schema",
        "system.diagrams",
        "system.annotations",
        "system.git_info",
        "system.github_info",
        "system.safety_harmful_content",
        "system.agent_fs",
        "system.agent_git",
        "system.agent_github",
        "system.agent_interpreter",
        "system.agent_docs",
    ],
    group: "copilot", // Group categorization for the script
    parameters: {
        question: {
            type: "string",
            description: "the user question",
        },
        "copilot.editor": {
            type: "string",
            description: "the content of the opened editor, if any",
            default: "",
        },
        "copilot.selection": {
            type: "string",
            description: "the content of the opened editor, if any",
            default: "",
        },
    },
    flexTokens: 20000, // Flexible token limit for the script
})

// Extract the 'question' parameter from the environment variables
const { question } = env.vars
const editor = env.vars["copilot.editor"]
const selection = env.vars["copilot.selection"]

$`## task

- make a plan to answer the QUESTION step by step using the information in the Context section
- answer the QUESTION

## output

- The final output will be inserted into the Visual Studio Code Copilot Chat window.
- do NOT include the plan in the output

## guidance:
- use the agent tools to help you
- do NOT be lazy, always finish the tasks
- do NOT skip any steps
`

// Define a variable QUESTION with the value of 'question'
def("QUESTION", question, { lineNumbers: false })

$`## Context`

// Define a variable FILE with the file data from the environment variables
// The { ignoreEmpty: true, flex: 1 } options specify to ignore empty files and to use flexible token allocation
def("FILE", env.files, { lineNumbers: false, ignoreEmpty: true, flex: 1 })
def("EDITOR", editor, { flex: 4, ignoreEmpty: true })
def("SELECTION", selection, { flex: 5, ignoreEmpty: true })
