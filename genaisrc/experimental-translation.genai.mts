script({
    title: "Experimental Markdown Translation with GPT-4.1",
    description: "Experimental script that uses gpt-4.1 to translate markdown documents with specialized translation tool",
    group: "Experimental",
    model: "openai:gpt-4", // Using gpt-4 as gpt-4.1 might not be available yet
    temperature: 0.1,
    parameters: {
        lang: "French",
        source: "English"
    }
})

// Parameters for the translation
const targetLanguage = env.vars.lang || "French"
const sourceLanguage = env.vars.source || "English"

// Get the markdown document to translate
const document = env.files[0]
if (!document) {
    cancel("No markdown document provided. Please provide a markdown file to translate.")
}

// Define the specialized translation tool
defTool(
    "specialized_translator", 
    "Call a specialized translation model to translate or validate text with high accuracy",
    {
        type: "object",
        properties: {
            text: {
                type: "string", 
                description: "The text content to translate"
            },
            source_language: {
                type: "string",
                description: "The source language of the text"
            },
            target_language: {
                type: "string", 
                description: "The target language to translate to"
            },
            context: {
                type: "string",
                description: "Additional context about the content type or domain"
            },
            validation_mode: {
                type: "boolean",
                description: "If true, validate an existing translation instead of creating a new one"
            }
        },
        required: ["text", "source_language", "target_language"]
    },
    async (args) => {
        const { text, source_language, target_language, context, validation_mode } = args
        
        // Use a specialized model for translation (gpt-4o for high quality)
        const translationPrompt = validation_mode 
            ? `You are a translation quality expert. Validate this ${target_language} translation of the original ${source_language} text.

Original ${source_language}:
${text}

Please analyze the translation for:
1. Accuracy of meaning and context
2. Fluency and naturalness in ${target_language}  
3. Preservation of markdown formatting
4. Appropriate handling of technical terms
5. Consistency with previous translations

Provide your analysis and suggest improvements if needed.`
            : `You are an expert translator specializing in ${source_language} to ${target_language} translation.

Translate the following text from ${source_language} to ${target_language}:

**CRITICAL REQUIREMENTS:**
- Preserve ALL markdown formatting exactly (headers, links, code blocks, lists, etc.)
- Do NOT translate code snippets (content within \`\`\` blocks or \`backticks\`)
- Do NOT translate URLs, file paths, or command line examples
- Do NOT translate technical identifiers or variable names
- Maintain the same tone, style and structure
- Keep technical terms appropriate for ${target_language} audience
${context ? `- Additional context: ${context}` : ''}

**Text to translate:**
${text}

**Output only the translated text, preserving exact formatting.**`

        try {
            const result = await runPrompt(
                (_) => {
                    _.$`${translationPrompt}`
                },
                {
                    model: "openai:gpt-4o", // Specialized high-quality model
                    temperature: 0.1,
                    responseType: "text"
                }
            )
            
            if (result.error) {
                return `Translation error: ${result.error}`
            }
            
            return result.text || "No translation result received"
        } catch (error) {
            return `Translation tool error: ${error.message}`
        }
    }
)

// Set up the document context
def("DOCUMENT", document, { language: "markdown" })

// Define output file for the translated document
defFileOutput(
    document.filename.replace(/\.md$/, `-${targetLanguage.toLowerCase()}.md`), 
    `Translated markdown document in ${targetLanguage}`
)

// Main prompt for the GPT-4 model
$`You are an expert at markdown document translation and quality assurance. 

Your task is to translate the markdown document in DOCUMENT from ${sourceLanguage} to ${targetLanguage}.

**Important Instructions:**
1. Use the specialized_translator tool to perform the actual translation work
2. Break down the document into logical sections for translation  
3. Use the tool to validate translations for quality and accuracy
4. Preserve all markdown formatting exactly (headers, links, code blocks, lists, etc.)
5. Do not translate:
   - Code snippets (content within backticks or code blocks)
   - URLs and links 
   - Technical identifiers or variable names
   - File paths or command line examples

**Process:**
1. First, analyze the document structure and identify sections to translate
2. For each section, call the specialized_translator tool to get the translation
3. Use the tool in validation mode to double-check critical sections
4. Provide the final complete translated document

**Quality Assurance:**
- Ensure consistency in terminology across sections
- Maintain the same document structure and formatting
- Preserve technical accuracy
- Keep the same tone and writing style

Begin the translation process now.`