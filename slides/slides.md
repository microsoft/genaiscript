---
# try also 'default' to start simple
theme: default
title: GenAIScript
info: |
  ## GenAIScript
  Scripting for Generative AI.

  Learn more at [genaiscript](https://microsoft.github.io/genaiscript/)
class: text-center
# https://sli.dev/custom/highlighters.html
highlighter: shiki
# https://sli.dev/guide/drawing
drawings:
  persist: false
# slide transition: https://sli.dev/guide/animations#slide-transitions
transition: slide-left
# enable MDC Syntax: https://sli.dev/guide/syntax#mdc-syntax
mdc: false
---

# GenAIScript

Scripting for Generative AI.

---

# Context + Script = Prompt


```mermaid

stateDiagram
  direction LR
    context: files (text, PDF, DOCX, ...)
    script : genaiscript (.genai.js)
    prompt : prompt (system+user messages)
    context --> script
    note right of context : Users starts from file/dir context in VSCode/CLI.
    images --> script
    note left of script : Lightweight syntax.
    script --> prompt : eval or import
```

---

# Context + Script = Prompt

- Generate Prompts with JavaScript
- `$` trick
- Builtin parsers
- `env.files` context

```js
// define the context
def("FILE", env.files, { endsWith: ".pdf" })
// structure the data
const schema = defSchema("DATA", 
    { type: "array", items: { type: "string" } })
// assign the task
$`Analyze FILE and extract data to JSON using the ${schema} schema.`
```

---

# Prompt + LLM = Response

- authentication: `.env` or `vscode.languageModel`
- tune prompts for LLM "preferences"

```mermaid
stateDiagram
  direction LR
    prompt : prompt (system + user messages)
    response: response (raw text)
    pre: ...
    pre --> prompt
    prompt --> LLM : OpenAI Chat API
    LLM --> response
```

> #1 ISSUE: WHERE CAN I GET A OPENAI KEY!?!

---


# Response + Parsers = Data + Files

```mermaid

stateDiagram
  direction LR
    response: response (text)
    data: data (JSON, YAML, CSV, ...)
    annotations: annotations (SARIF, ...)
    files: files
    note right of data: Schema validation
    note right of files: Full, diff\nRefactoring preview
    note right of annotations: GitHub Actions,\nGitHub Security Alerts,\nVSCode diagnostics, ...
    LLM: ...
    LLM --> response
    response --> files
    response --> data
    response --> annotations
```

---


# Transformation Pipeline

```mermaid

stateDiagram
  direction LR
    context: files (text, PDF, DOCX, ...)
    script : genaiscript (.genai.js)
    prompt : prompt (system+user messages)
    response: response (text)
    data: data (JSON, YAML, CSV, ...)
    annotations: annotations (SARIF, ...)
    context --> script
    script --> prompt : eval or import
    prompt --> LLM : OpenAI Chat API
    LLM --> script : tool call (js)
    LLM --> response
    response --> files
    response --> data
    response --> annotations
```
