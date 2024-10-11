script({
    system: [
        // List of system components and tools available for the script
        "system",
        "system.tools",
        "system.files",
        "system.diagrams",
        "system.annotations",
        "system.git_info",
        "system.github_info",
        "system.safety_harmful_content",
    ],
    tools: ["agent"], // Tools that the script can use
    group: "infrastructure", // Group categorization for the script
    parameters: {
        question: {
            type: "string", // Type of the parameter
            description: "the user question", // Description of the parameter
        },
    },
    flexTokens: 20000, // Flexible token limit for the script
})

// Extract the 'question' parameter from the environment variables
const { question } = env.vars

$`## task

- make a plan to answer the QUESTION step by step
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
def("QUESTION", question)

// Define a variable FILE with the file data from the environment variables
// The { ignoreEmpty: true, flex: 1 } options specify to ignore empty files and to use flexible token allocation
def("FILE", env.files, { ignoreEmpty: true, flex: 1 })
