script({
    title: "GPT-4.1 Experimental Translation Agent",
    description: "Advanced experimental script showcasing GPT-4.1 with specialized translation validation tools",
    group: "Experimental",
    model: "openai:gpt-4-turbo", // More advanced model for experimental features
    temperature: 0.05, // Very low temperature for consistency
    parameters: {
        lang: "Spanish", 
        source: "English",
        validation_passes: 2
    },
    system: ["system.assistant", "system.safety_jailbreak"]
})

// Get configuration from environment variables
const targetLanguage = env.vars.lang || "Spanish"
const sourceLanguage = env.vars.source || "English" 
const validationPasses = parseInt(env.vars.validation_passes) || 2

// Validate input document
const document = env.files[0]
if (!document) {
    cancel("❌ No markdown document provided. Please specify a markdown file to translate.")
}

console.log(`🚀 Starting experimental translation: ${sourceLanguage} → ${targetLanguage}`)
console.log(`📄 Document: ${document.filename}`)
console.log(`🔄 Validation passes: ${validationPasses}`)

// Define the specialized translation tool that uses a different model
defTool(
    "specialized_translator",
    "Advanced translation tool using specialized models for high-quality markdown translation",
    {
        type: "object", 
        properties: {
            text: {
                type: "string",
                description: "Content to translate (can be markdown formatted)"
            },
            source_language: {
                type: "string", 
                description: "Source language (e.g., 'English')"
            },
            target_language: {
                type: "string",
                description: "Target language (e.g., 'Spanish')"  
            },
            section_type: {
                type: "string",
                description: "Type of content: header, paragraph, list, code_comment, etc."
            },
            preserve_formatting: {
                type: "boolean",
                description: "Whether to strictly preserve markdown formatting",
                default: true
            }
        },
        required: ["text", "source_language", "target_language"]
    },
    async (args) => {
        const { text, source_language, target_language, section_type, preserve_formatting = true } = args
        
        console.log(`🔧 Translation tool called for: ${section_type || 'content'} (${text.length} chars)`)
        
        const specializedPrompt = `You are a specialized translation AI trained specifically for ${source_language} to ${target_language} translation.

**CONTENT TYPE:** ${section_type || 'general'}
**FORMATTING:** ${preserve_formatting ? 'STRICT markdown preservation required' : 'formatting flexible'}

**TRANSLATION RULES:**
1. NEVER translate content within code blocks (\`\`\` or \`)
2. NEVER translate URLs, email addresses, or file paths  
3. PRESERVE all markdown formatting exactly: headers (#), links ([]()), emphasis (**bold**, *italic*)
4. Keep technical terms consistent and appropriate
5. Maintain the same document structure and hierarchy
6. For ${target_language}: use appropriate cultural context and idioms

**SOURCE TEXT (${source_language}):**
${text}

**OUTPUT:** Only the translated text with preserved formatting.`

        try {
            const result = await runPrompt(
                (_) => {
                    _.$`${specializedPrompt}`
                },
                {
                    model: "openai:gpt-4o", // Using the specialized model
                    temperature: 0.1,
                    responseType: "text",
                    label: `translate_${section_type || 'content'}`
                }
            )
            
            if (result.error) {
                return `❌ Translation error: ${result.error}`
            }
            
            const translation = result.text?.trim()
            console.log(`✅ Translation completed (${translation?.length || 0} chars)`)
            return translation || "⚠️ Empty translation result"
            
        } catch (error) {
            console.error(`❌ Translation tool error:`, error.message)
            return `❌ Tool error: ${error.message}`
        }
    }
)

// Define translation validation tool  
defTool(
    "translation_validator",
    "Validate translation quality and suggest improvements",
    {
        type: "object",
        properties: {
            original: { type: "string", description: "Original text in source language" },
            translation: { type: "string", description: "Translated text to validate" },
            source_language: { type: "string", description: "Source language" },
            target_language: { type: "string", description: "Target language" }
        },
        required: ["original", "translation", "source_language", "target_language"]
    },
    async (args) => {
        const { original, translation, source_language, target_language } = args
        
        console.log(`🔍 Validating translation quality...`)
        
        const validationPrompt = `You are a translation quality expert. Analyze this translation:

**ORIGINAL (${source_language}):**
${original}

**TRANSLATION (${target_language}):** 
${translation}

**VALIDATION CRITERIA:**
1. Accuracy: Is the meaning preserved?
2. Fluency: Does it sound natural in ${target_language}?
3. Format: Is markdown formatting preserved correctly?
4. Technical terms: Are they handled appropriately?
5. Completeness: Is anything missing or added?

**RESPOND WITH:**
- QUALITY_SCORE: (1-10)
- ISSUES: List any problems found
- IMPROVEMENTS: Suggest specific improvements if needed
- APPROVED: true/false`

        try {
            const result = await runPrompt(
                (_) => {
                    _.$`${validationPrompt}`
                },
                {
                    model: "openai:gpt-4", // Using main model for validation
                    temperature: 0.1,
                    responseType: "text",
                    label: "validation"
                }
            )
            
            return result.text || "No validation result"
            
        } catch (error) {
            return `❌ Validation error: ${error.message}`
        }
    }
)

// Set up document context and output
def("DOCUMENT", document, { language: "markdown" })
defFileOutput(
    document.filename.replace(/\.md$/, `-${targetLanguage.toLowerCase()}.md`),
    `Experimental translation to ${targetLanguage} using GPT-4.1 methodology`
)

// Main experimental translation workflow
$`# 🧪 Experimental GPT-4.1 Translation Task

You are an advanced translation coordinator using cutting-edge GPT-4.1 capabilities. Your task is to translate the markdown document in DOCUMENT from ${sourceLanguage} to ${targetLanguage} using a sophisticated multi-tool approach.

## 🎯 Mission Parameters
- **Source:** ${sourceLanguage}  
- **Target:** ${targetLanguage}
- **Document:** ${document.filename}
- **Validation Passes:** ${validationPasses}
- **Quality Standard:** Production-ready

## 🔬 Experimental Process

### Phase 1: Document Analysis
First, analyze the DOCUMENT structure and identify:
1. Document sections (headers, paragraphs, lists, code blocks)
2. Technical content that requires special handling
3. Links, references, and metadata to preserve
4. Cultural/contextual elements needing adaptation

### Phase 2: Intelligent Translation
For each section:
1. Call **specialized_translator** tool with appropriate section_type
2. Use context-aware translation for technical vs. general content  
3. Maintain strict markdown formatting compliance
4. Preserve code blocks, URLs, and technical identifiers exactly

### Phase 3: Quality Assurance  
1. Use **translation_validator** tool for critical sections
2. Perform ${validationPasses} validation passes on the complete document
3. Ensure consistency across sections
4. Verify technical accuracy and cultural appropriateness

### Phase 4: Final Output
Provide the complete translated document with:
- All original formatting preserved
- Consistent terminology throughout
- Cultural adaptation where appropriate  
- Technical accuracy maintained

## 🚀 Execute Translation

Begin the experimental translation process now, following the multi-phase approach and utilizing both specialized tools for optimal results.

**Remember:** This is experimental GPT-4.1 methodology - use advanced reasoning, tool coordination, and quality validation throughout the process.`