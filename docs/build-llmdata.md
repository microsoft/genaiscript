# LLM Data Build Script

This document describes the `build-llmdata.mjs` script that fetches LLM data from models.dev and generates the `llmdata.js` file.

## Overview

The build script:
1. Fetches model and provider data from the models.dev API
2. Transforms the data to match GenAIScript's format
3. Generates a JavaScript module (`llmdata.js`) and TypeScript definitions (`llmdata.d.ts`)
4. Includes comprehensive error handling with fallback behavior

## Usage

### Command Line

```bash
# Run from the root directory
yarn build:llmdata

# Or run directly
node scripts/build-llmdata.mjs
```

### Programmatic

```javascript
import { buildLLMData } from './scripts/build-llmdata.mjs'

await buildLLMData()
```

## Generated Files

### `packages/core/src/llmdata.js`

JavaScript module containing the LLM data:

```javascript
import LLMDATA, { providers, models, aliases, pricings } from './llmdata.js'

console.log(`Found ${providers.length} providers`)
console.log(`Found ${models.length} models`)
```

### `packages/core/src/llmdata.d.ts`

TypeScript definitions for the generated data.

### Schema

The generated data follows the schema defined in `docs/public/schemas/llmdata.json`.

## Data Structure

The generated `llmdata.js` exports an object with the following structure:

```javascript
{
  "$schema": "../../../docs/public/schemas/llmdata.json",
  "version": "1.0.0",
  "generated": "2025-06-27T15:28:11.594Z",
  "source": "models.dev",
  "lastUpdated": "2025-06-27T15:28:11.594Z",
  "providers": [
    {
      "id": "provider_id",
      "detail": "Provider description",
      "url": "https://provider.com",
      "aliases": { "large": "model-name" },
      "models": { "model-id": { "tools": true } },
      "env": { "API_KEY": { "required": true } }
    }
  ],
  "models": [
    {
      "id": "model-id",
      "provider": "provider_id",
      "name": "Model Name",
      "description": "Model description",
      "capabilities": { "tools": true },
      "context_length": 128000,
      "pricing": {
        "price_per_million_input_tokens": 1.0,
        "price_per_million_output_tokens": 3.0
      }
    }
  ],
  "aliases": {
    "large": "provider:model",
    "small": "provider:small-model"
  },
  "pricings": {
    "provider:model": {
      "price_per_million_input_tokens": 1.0,
      "price_per_million_output_tokens": 3.0
    }
  }
}
```

## Error Handling

If the models.dev API is unavailable:
- The script continues with a warning
- Generates a minimal data structure with empty arrays
- Includes an `error` field in the generated data
- Exit code remains 0 to avoid breaking builds

## Integration

### Build Pipeline

Add to your build pipeline:

```bash
yarn build:llmdata && yarn compile
```

### Continuous Integration

The script is designed to be CI-friendly:
- Non-zero exit codes only on fatal errors
- Graceful handling of network issues
- Deterministic output format

## Extending

To modify the data transformation:

1. Edit the `transformModelsData()` function in `scripts/build-llmdata.mjs`
2. Update the schema in `docs/public/schemas/llmdata.json`
3. Update TypeScript definitions in the script
4. Test with `yarn build:llmdata`

## API Documentation

### models.dev API

The script expects the models.dev API to return:

```json
{
  "models": [
    {
      "id": "model-id",
      "name": "Model Name",
      "provider": "provider-id",
      "description": "Description",
      "capabilities": {},
      "context_length": 128000,
      "pricing": {}
    }
  ],
  "providers": [
    {
      "id": "provider-id",
      "name": "Provider Name",
      "description": "Description",
      "url": "https://provider.com",
      "aliases": {},
      "models": {},
      "environment": {}
    }
  ],
  "lastUpdated": "2025-06-27T15:28:11.594Z"
}
```

### Generated Module API

```typescript
interface LLMData {
  $schema: string
  version: string
  generated: string
  source: string
  lastUpdated?: string
  providers: LLMProvider[]
  models: LLMModel[]
  aliases: Record<string, string>
  pricings: Record<string, any>
}

export default LLMDATA: LLMData
export const providers: LLMProvider[]
export const models: LLMModel[]
export const aliases: Record<string, string>
export const pricings: Record<string, any>
```