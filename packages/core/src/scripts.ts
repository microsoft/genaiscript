export function createScript(name: string, options?: { template: PromptTemplate, title?: string }) {
    const { template, title } = options || {}
    const t = structuredClone(
        template || {
            id: "",
            title: title || name,
            text: "New script empty template",
            jsSource: `// metadata and model configuration
// https://microsoft.github.io/genaiscript/reference/scripts/metadata/
script({ title: "${name}" })

// use def to emit LLM variables 
// https://microsoft.github.io/genaiscript/reference/scripts/context/#definition-def
def("FILE", env.files)

// use $ to output formatted text to the prompt
// https://microsoft.github.io/genaiscript/reference/scripts/prompt/
$\`You are a helpful assistant.
TELL THE LLM WHAT TO DO...\`        

// next, "Run GenAIScript" on a file or folder
// https://microsoft.github.io/genaiscript/getting-started/running-scripts/
`,
        }
    )
    t.id = ""
    return t
}