# Experimental GPT-4.1 Translation Scripts

This directory contains experimental translation scripts that demonstrate advanced GenAIScript capabilities using GPT-4.1 methodology with specialized translation tools.

## Scripts Overview

### 1. `experimental-translation.genai.mts`
A foundational experimental script that demonstrates:
- GPT-4 as the main coordination model
- Specialized translation tool using GPT-4o for high-quality translation
- Tool-based architecture for translation and validation
- Markdown format preservation
- Configurable source and target languages

### 2. `experimental-gpt41-translator.genai.mts` 
An advanced experimental script showcasing:
- GPT-4 Turbo as the coordination model (simulating GPT-4.1 methodology)
- Multiple specialized tools: translation and validation
- Multi-phase translation workflow
- Quality assurance with multiple validation passes
- Advanced error handling and logging
- Cultural adaptation considerations

## Key Experimental Features

### Tool-Based Translation Architecture
Both scripts demonstrate how GPT models can orchestrate specialized tools:

```typescript
// The main GPT model calls specialized translation tools
defTool("specialized_translator", "description", schema, async (args) => {
    // Uses a different specialized model for translation
    const result = await runPrompt(_, { model: "openai:gpt-4o" })
    return result.text
})
```

### Multi-Model Approach
- **Coordination Model**: GPT-4 / GPT-4 Turbo manages the overall workflow
- **Specialized Model**: GPT-4o performs the actual translation work
- **Validation Model**: GPT-4 validates translation quality

### Advanced Features
1. **Context-Aware Translation**: Tools understand document structure and content type
2. **Markdown Preservation**: Strict formatting preservation rules
3. **Quality Validation**: Multi-pass validation for accuracy and fluency
4. **Error Handling**: Comprehensive error reporting and recovery
5. **Cultural Adaptation**: Context-appropriate translation choices

## Usage

### Basic Usage
```bash
# Translate to French (default)
npx genaiscript run experimental-translation sample-doc.md

# Translate to Spanish  
npx genaiscript run experimental-translation sample-doc.md --vars lang=Spanish

# Use advanced experimental features
npx genaiscript run experimental-gpt41-translator sample-doc.md --vars lang=German validation_passes=3
```

### Parameters
- `lang`: Target language (default: "French" / "Spanish")
- `source`: Source language (default: "English")
- `validation_passes`: Number of quality validation rounds (advanced script only)

### Input Requirements
- Markdown documents (.md files)
- Documents should contain standard markdown elements (headers, links, code blocks, etc.)

### Output
- Translated document with preserved formatting
- Quality validation reports (advanced script)
- Translation process logs

## Technical Architecture

### Tool Chain Flow
```
Input Document → GPT-4 Coordinator → Specialized Translation Tool (GPT-4o) → Validation Tool (GPT-4) → Output Document
```

### Tool Definitions
Both scripts register tools using the GenAIScript `defTool` API:
- Tools have JSON schema parameters
- Tools can call different models internally
- Tools provide structured responses to the main model

### Model Selection Strategy
- **GPT-4/GPT-4 Turbo**: Strategic coordination and workflow management
- **GPT-4o**: High-quality translation with better multilingual capabilities
- **Temperature settings**: Low values (0.05-0.1) for consistency

## Experimental Aspects

### GPT-4.1 Methodology
These scripts simulate anticipated GPT-4.1 capabilities:
1. **Tool Orchestration**: Advanced coordination between multiple specialized tools
2. **Multi-Step Reasoning**: Complex workflows with validation and quality assurance
3. **Context Awareness**: Understanding document structure and content types
4. **Quality Control**: Automated validation and improvement suggestions

### Innovation Areas
1. **Hybrid Model Architecture**: Combining different models for optimal results
2. **Iterative Quality Improvement**: Multiple validation and refinement passes
3. **Structured Tool Communication**: Rich parameter schemas and error handling
4. **Cultural Intelligence**: Context-aware translation decisions

## Testing

Use the provided `sample-doc.md` for testing:
```bash
npx genaiscript run experimental-gpt41-translator sample-doc.md --vars lang=Italian
```

The sample document includes various markdown elements to test:
- Headers and formatting
- Code blocks (should not be translated)
- Links and URLs (should be preserved)
- Technical content mixed with natural language

## Limitations and Considerations

### Current Limitations
- Requires OpenAI API access for GPT-4 and GPT-4o models
- Processing time increases with document size and validation passes
- Token usage is higher due to multi-model approach

### Future Enhancements
- Support for additional specialized models
- Batch processing for multiple documents
- Custom terminology dictionaries
- Integration with translation memories

## Contributing

These are experimental scripts designed to explore advanced GenAIScript patterns. Feel free to:
- Extend with additional tools
- Add support for more languages
- Implement custom validation criteria
- Integrate with external translation APIs

## License

Part of the GenAIScript project under MIT license.