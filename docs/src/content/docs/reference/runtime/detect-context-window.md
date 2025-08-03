---
title: Detect Context Window
description: Automatically detect model context window limits at runtime
sidebar:
  order: 85
---

The `detectContextWindow` function in GenAIScript allows you to automatically discover the available context window size for any given model identifier at runtime. This eliminates the need to manually hardcode context limits and enables more intelligent content management.

The function returns the context window size as a number of tokens, or -1 if detection fails.

## Usage

`detectContextWindow` is defined in the [GenAIScript runtime](/genaiscript/reference/runtime) and needs to be imported. It takes a model identifier and optional configuration, returning the detected context window size in tokens.

```js
import { detectContextWindow } from "@genaiscript/runtime"

// Basic usage
const contextTokens = await detectContextWindow("github:gpt-4o")
if (contextTokens > 0) {
  console.log(`Context window: ${contextTokens} tokens`)
} else {
  console.log("Failed to detect context window")
}
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
const contextTokens = await detectContextWindow("openai:gpt-4", {
  maxContextWindow: 128000,     // Maximum context window to test
  testPayloadSize: 64000,       // Size of test payload (characters)
  cacheName: "custom-cache",    // Custom cache name
  // Standard model options also supported
  temperature: 0.1,
  maxTokens: 100
})

if (contextTokens > 0) {
  console.log(`Detected ${contextTokens} tokens`)
} else {
  console.log("Detection failed")
}
```

### Configuration Options

- **`maxContextWindow`** (default: 256000): Maximum context window size to test during detection
- **`testPayloadSize`** (default: 4194304): Size of the test payload in characters for the massive payload strategy
- **`cacheName`** (default: "context-windows"): Name of the cache to store detection results

## Return Value

The function returns a Promise that resolves to a number:

- **Positive number**: The detected context window size in tokens
- **-1**: Detection failed (cached to avoid repeated failures)

```js
const contextTokens = await detectContextWindow("github:gpt-4o")

if (contextTokens > 0) {
  console.log(`Context window: ${contextTokens} tokens`)
} else {
  console.log("Failed to detect context window")
}
```

## Detection Strategies

The function uses multiple strategies to reliably detect context window limits:

### 1. Cache Lookup

Results are automatically cached to avoid repeated detection overhead:

```js
// First call performs detection
const contextTokens1 = await detectContextWindow("github:gpt-4o")

// Subsequent calls use cached result (including -1 for failures)
const contextTokens2 = await detectContextWindow("github:gpt-4o") 
// contextTokens1 === contextTokens2
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

The function handles errors gracefully by returning -1 when detection fails. Debug logging is used for detailed error information:

```js
const contextTokens = await detectContextWindow("invalid:model")

if (contextTokens === -1) {
  console.log("Detection failed - using fallback")
  
  // Use fallback values or handle gracefully
  const fallbackContextWindow = 4096
} else {
  console.log(`Detected context window: ${contextTokens} tokens`)
}
```

Enable debug logging to see detailed error information:

```bash
DEBUG=genaiscript:runtime:context node your-script.js
```

## Model and Configuration

The function supports all standard model configuration options through the `ChatGenerationContextOptions`:

```js
const contextTokens = await detectContextWindow("azure:gpt-4", {
  temperature: 0,
  apiKey: process.env.AZURE_API_KEY,
  endpoint: "https://my-instance.openai.azure.com/",
  // ... other model-specific options
})

if (contextTokens > 0) {
  console.log(`Azure GPT-4 context window: ${contextTokens} tokens`)
}
```

## Practical Applications

### Dynamic Content Sizing

```js
const contextTokens = await detectContextWindow("github:gpt-4o")

if (contextTokens > 0) {
  // Adjust content based on detected limits
  const maxContentSize = Math.floor(contextTokens * 0.8) // Leave 20% buffer
  
  if (content.length > maxContentSize) {
    content = content.substring(0, maxContentSize)
  }
} else {
  // Use fallback for failed detection
  const fallbackSize = 4000
  if (content.length > fallbackSize) {
    content = content.substring(0, fallbackSize)
  }
}
```

### Intelligent Chunking

```js
async function processLargeDocument(text, modelId) {
  const contextTokens = await detectContextWindow(modelId)
  
  if (contextTokens === -1) {
    throw new Error("Could not detect context window for model")
  }
  
  const chunkSize = Math.floor(contextTokens * 0.7) // Conservative chunk size
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
    const contextTokens = await detectContextWindow(modelId)
    
    if (contextTokens >= requiredTokens) {
      return modelId // First model that can handle the content
    }
  }
  
  throw new Error("No model found with sufficient context window")
}
```

## Performance Considerations

- **Caching**: Results are automatically cached to minimize API calls and detection overhead (including -1 values for failed detections)
- **Cost**: Detection involves test API calls that may incur costs, but caching ensures this happens only once per model
- **Timeout**: Detection may take time depending on the model and strategy used

## Limitations

- Detection accuracy depends on the model's error message format
- Some models may not provide clear context window error messages
- Binary search fallback adds additional API calls but improves reliability
- Failed detections return -1 and are cached to avoid repeated attempts
- Results are cached and may not reflect real-time changes to model limits