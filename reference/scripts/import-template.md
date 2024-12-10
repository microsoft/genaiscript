
Various LLM tools allow storing prompts in text or markdown files.
You can use `importTemplate` to import these files into a prompt.

```markdown title="cot.md"
Explain your answer step by step.
```

```js title="tool.genai.mjs"
importTemplate("cot.md");
```

## Variable interpolation

`importTemplate` supports [mustache](https://mustache.github.io/) variable interpolation. You can use variables in the imported template and pass them as arguments to the `importTemplate` function.

```markdown title="time.md"
The current time is {{time}}.
```

```js title="tool.genai.mjs"
importTemplate("time.md", { time: "12:00" });
```

Mustache supports arguments as functions. This allows you to pass dynamic values to the template.

```js title="tool.genai.mjs"
importTemplate("time.md", { time: () => Date.now() });
```


## File globs

You can specify an array of files or glob patterns.

```js
importTemplate("*.prompt")
```

## Other File formats

Aside from the basic text or markdown formats, `importTemplate` also supports these variations automatically.

### Prompty

[Prompty](https://prompty.ai/) provides a simple markdown-based format for prompts. It adds the concept of role sections to the markdown format.

```markdown
---
name: Basic Prompt
description: A basic prompt that uses the chat API to answer questions
...
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
importTemplate("basic.prompty", { question: "what is the capital of France?" });
```
