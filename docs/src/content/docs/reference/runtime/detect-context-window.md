---
title: Detect Context Window
description: Automatically detect model context window limits at runtime
sidebar:
  order: 85
---

The `detectContextWindow` function in GenAIScript allows you to automatically discover the available context window size for any given model identifier at runtime. This eliminates the need to manually hardcode context limits and enables more intelligent content management.

## Usage

`detectContextWindow` is defined in the [GenAIScript runtime](/genaiscript/reference/runtime) and needs to be imported. It takes a model identifier and optional configuration, returning the detected context window size and detection metadata.

```js
import { detectContextWindow } from "@genaiscript/runtime"

// Basic usage
const result = await detectContextWindow("github:gpt-4o")
console.log(`Context window: ${result.promptTokens} tokens`)
```

:::note

`detectContextWindow` is provided as part of the runtime and needs to be imported using this code...

```js
import { detectContextWindow } from "@genaiscript/runtime"
```

:::

## Options

The function accepts a second parameter with configuration options that extend the standard `ChatGenerationContextOptions`:

```js
const result = await detectContextWindow("openai:gpt-4", {
  maxContextWindow: 128000,     // Maximum context window to test
  testPayloadSize: 64000,       // Size of test payload (characters)
  cacheName: "custom-cache",    // Custom cache name
  // Standard model options also supported
  temperature: 0.1,
  maxTokens: 100
})
```

### Configuration Options

- **`maxContextWindow`** (default: 256000): Maximum context window size to test during detection
- **`testPayloadSize`** (default: 4194304): Size of the test payload in characters for the massive payload strategy
- **`cacheName`** (default: "context-windows"): Name of the cache to store detection results

## Return Value

The function returns a `ContextWindowResult` object with the following properties:

```typescript
interface ContextWindowResult {
  promptTokens: number;            // Detected context window size in tokens
  cached?: boolean;               // Whether result was retrieved from cache
  error?: string;                 // Error message if detection failed
}
```

## Detection Strategies

The function uses multiple strategies to reliably detect context window limits:

### 1. Cache Lookup

Results are automatically cached to avoid repeated detection overhead:

```js
// First call performs detection
const result1 = await detectContextWindow("github:gpt-4o")

// Subsequent calls use cached result
const result2 = await detectContextWindow("github:gpt-4o") 
console.log(result2.cached) // true
```

### 2. Massive Payload Strategy

Sends a large test payload and parses error messages to extract context limits. It recognizes common error patterns like:

- `"Max size: 16000 tokens"`
- `"maximum context length is 8000"`  
- `"context length of 5000 exceeds limit of 4096"`
- `"input tokens (12000) exceeds maximum allowed (8192)"`

### 3. Binary Search Fallback

When error message parsing fails, uses binary search to find the exact context window boundary by testing progressively different payload sizes.

## Error Handling

The function provides graceful error handling with detailed error information:

```js
const result = await detectContextWindow("invalid:model")

if (result.error) {
  console.log("Detection failed:", result.error)
  console.log("Prompt tokens:", result.promptTokens) // 0
  
  // Use fallback values or handle gracefully
  const fallbackContextWindow = 4096
}
```

## Model and Configuration

The function supports all standard model configuration options through the `ChatGenerationContextOptions`:

```js
const result = await detectContextWindow("azure:gpt-4", {
  temperature: 0,
  apiKey: process.env.AZURE_API_KEY,
  endpoint: "https://my-instance.openai.azure.com/",
  // ... other model-specific options
})
```

## Practical Applications

### Dynamic Content Sizing

```js
const result = await detectContextWindow("github:gpt-4o")

if (result.promptTokens > 0) {
  // Adjust content based on detected limits
  const maxContentSize = Math.floor(result.promptTokens * 0.8) // Leave 20% buffer
  
  if (content.length > maxContentSize) {
    content = content.substring(0, maxContentSize)
  }
}
```

### Intelligent Chunking

```js
async function processLargeDocument(text, modelId) {
  const { promptTokens } = await detectContextWindow(modelId)
  
  if (promptTokens === 0) {
    throw new Error("Could not detect context window for model")
  }
  
  const chunkSize = Math.floor(promptTokens * 0.7) // Conservative chunk size
  const chunks = []
  
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize))
  }
  
  return chunks
}
```

### Model Selection

```js
async function selectBestModel(content, models) {
  const requiredTokens = Math.ceil(content.length / 4) // Rough token estimate
  
  for (const modelId of models) {
    const result = await detectContextWindow(modelId)
    
    if (result.promptTokens >= requiredTokens) {
      return modelId // First model that can handle the content
    }
  }
  
  throw new Error("No model found with sufficient context window")
}
```

## Performance Considerations

- **Caching**: Results are automatically cached to minimize API calls and detection overhead
- **Cost**: Detection involves test API calls that may incur costs, but caching ensures this happens only once per model
- **Timeout**: Detection may take time depending on the model and strategy used

## Limitations

- Detection accuracy depends on the model's error message format
- Some models may not provide clear context window error messages
- Binary search fallback adds additional API calls but improves reliability
- Results are cached and may not reflect real-time changes to model limits