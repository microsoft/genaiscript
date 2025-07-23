# OpenAI Responses API Support

This implementation adds support for OpenAI's Responses API, which provides optimized handling for structured outputs and improved reliability for JSON schema responses.

## Features

- **Automatic Optimization**: The OpenAI provider now uses the Responses API by default, providing better structured output handling
- **Enhanced JSON Schema Support**: Improved reliability for `json_schema` response format with strict mode enabled
- **Reasoning Model Support**: Optimized settings for OpenAI's reasoning models (o1, o3, etc.)
- **Backward Compatibility**: All existing OpenAI features remain unchanged

## Usage

### Default Behavior
The OpenAI provider automatically uses the Responses API:

```typescript
script({
    model: "openai:gpt-4o-mini",
    responseSchema: {
        type: "object",
        properties: {
            summary: { type: "string" },
            confidence: { type: "number" }
        }
    }
})
```

### Manual Configuration
You can explicitly configure the API type in your language model configuration:

```typescript
// In your configuration
{
    type: "openai_responses",
    base: "https://api.openai.com/v1",
    token: "your-api-key"
}
```

## Benefits

1. **Better Structured Outputs**: Enhanced reliability for JSON schema responses
2. **Optimized Performance**: Improved handling of structured output requests
3. **Future-Ready**: Prepared for OpenAI's dedicated responses endpoint when available
4. **Seamless Migration**: Existing scripts work without changes

## Implementation Details

- Added `"openai_responses"` to the `OpenAIAPIType` union
- Created specialized `OpenAIResponsesAPIChatCompletion` handler
- Updated language model resolution to use Responses API by default
- Maintains compatibility with all existing OpenAI features