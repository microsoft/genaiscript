
# Context x Script ⇨ Prompt

- user runs script on files in VSCode/CLI/Web
- script generates chat messages (user and system messages)
- invocation of LLM (typically OpenAI REST API or compatible) + tools cycle

```mermaid

stateDiagram
  direction LR
    [*] --> context
    context: files (text, PDF, DOCX, ...)
    script : user script (.genai.js)
    prompt : prompt (system+user messages)
    api: OpenAI API
    system: system script (system.*.genai.js)
    tools: tools (JS functions)
    context --> script
    note right of context : Users selects files in VSCode/CLI.
    script --> prompt
    system --> prompt
    prompt --> api
    api --> tools
    tools --> api
    api --> validation
    validation: Schema Validation, Data Repair
    validation --> api
    api --> response
    note left of system: micro text formats, tools, agents
    response: response (raw text)
```
