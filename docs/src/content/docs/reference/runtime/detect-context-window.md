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
import { detectContextWindow } from "@genaiscript/runtime";

// Basic usage
const { promptTokens } =
  await detectContextWindow("github:gpt-4o");
if (promptTokens > 0) {
  console.log(`Context window: ${promptTokens} tokens`);
} else {
  console.log("Failed to detect context window");
}
```

:::note

`detectContextWindow` is provided as part of the runtime and needs to be imported using this code...

```js
import { detectContextWindow } from "@genaiscript/runtime";
```

:::
