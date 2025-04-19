---
title: Import Template
sidebar:
  order: 50
description: Learn how to import prompt templates into GenAIScript using
  `importTemplate` with support for mustache variable interpolation and file
  globs.
keywords: importTemplate, prompts, mustache, variable interpolation, file globs
hero:
  image:
    alt: A digital scene in classic 8-bit style shows stacked rectangles with tabs,
      symbolizing documents, linked by bold arrows to a computer screen with
      bracket and brace icons representing code. Small circles suggest
      variables, a simple clock icon refers to time, and minimal template shapes
      are present. The image uses five corporate colors on a flat, single-color
      background, is highly simplified and geometric, and measures 128 by 128
      pixels. There are no people, no words, and no realistic effects.
    file: ./import-template.png

---

Various LLM tools allow storing prompts in text or markdown files.
You can use `importTemplate` to import these files into a prompt.

```markdown title="cot.md"
Explain your answer step by step.
```

```js title="tool.genai.mjs"
importTemplate("cot.md")
```

## Variable interpolation

`importTemplate` supports [mustache](https://mustache.github.io/) (default), [Jinja](https://www.npmjs.com/package/@huggingface/jinja) variable interpolation and the [Prompty](https://prompty.ai/) file format. You can use variables in the imported template and pass them as arguments to the `importTemplate` function.

```markdown title="time.md"
The current time is {{time}}.
```

```js title="tool.genai.mjs"
importTemplate("time.md", { time: "12:00" })
```

Mustache supports arguments as functions. This allows you to pass dynamic values to the template.

```js title="tool.genai.mjs"
importTemplate("time.md", { time: () => Date.now() })
```

## More way to specify files

You can use the results of `workspace.readText`.

```js title="tool.genai.mjs"
const file = await workspace.readText("time.md")
importTemplate(time, { time: "12:00" })
```

You can specify an array of files or glob patterns.

```js
importTemplate("*.prompt")
```

## Prompty

[Prompty](https://prompty.ai/) provides a simple markdown-based format for prompts. It adds the concept of role sections to the markdown format.

```markdown
---
name: Basic Prompt
description: A basic prompt that uses the chat API to answer questions
---

inputs:
question:
type: string
sample:
"question": "Who is the most famous person in the world?"

---

system:
You are an AI assistant who helps people find information.
As the assistant, you answer questions briefly, succinctly.

user:
{{question}}
```

```js title="tool.genai.mjs"
importTemplate("basic.prompty", { question: "what is the capital of France?" })
```
