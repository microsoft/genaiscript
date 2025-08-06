---
title: "Test Markdown Script"
description: "A test script to verify markdown script support"
model: "small"
temperature: 0.7
files: ["./src/rag/markdown.md"]
---

```ts genai
console.log(env.files);
const file = def("FILE", env.files);
```

![](./src/robots.jpg)

# Test Markdown Script

This is a test markdown script that should be transpiled to a GenAIScript.

Write a short poem about ${file}.
