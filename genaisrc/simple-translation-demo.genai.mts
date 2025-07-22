script({
    title: "Simple GPT-4.1 Translation Demo",
    description: "Minimal demo showing GPT-4.1 methodology with translation tools",
    group: "Experimental", 
    model: "openai:gpt-4",
    temperature: 0.1
})

// Simple configuration
const targetLang = env.vars.lang || "French"

// Get document to translate
const doc = env.files[0] 
if (!doc) cancel("Please provide a markdown file to translate")

// Register the specialized translation tool
defTool(
    "translation_specialist",
    "High-quality translation tool using specialized model",
    {
        text: { type: "string", description: "Text to translate" },
        target_language: { type: "string", description: "Target language" }
    },
    async ({ text, target_language }) => {
        console.log(`🔧 Translating to ${target_language}...`)
        
        const result = await runPrompt(
            (_) => {
                _.$`Translate this text to ${target_language}. Preserve markdown formatting exactly:

${text}`
            },
            { 
                model: "openai:gpt-4o", // Specialized model
                temperature: 0.1
            }
        )
        
        return result.text || "Translation failed"
    }
)

// Set up context
def("DOCUMENT", doc, { language: "markdown" })

// Main prompt
$`You are demonstrating GPT-4.1 experimental capabilities. 

**Task**: Translate the markdown document in DOCUMENT to ${targetLang}.

**Method**: Use the translation_specialist tool to perform the actual translation work.

**Instructions**: 
1. Analyze the document structure
2. Call the translation_specialist tool to translate the content  
3. Ensure all markdown formatting is preserved
4. Provide the complete translated document

This demonstrates how GPT-4.1 can orchestrate specialized tools for better results.`