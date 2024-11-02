
# Context x Script = Prompt

- user starts script on files in VSCode/CLI
- script generates prompt (user and system messages)
- invocation of LLM API with messages + access token (from `.env` or environment variables).

```mermaid

stateDiagram
  direction LR
    [*] --> context
    context: files (text, PDF, DOCX, ...)
    script : user script (.genai.js)
    prompt : prompt (system+user messages)
    api: OpenAI API
    system: system script (system.*.genai.js)
    tools: custom tools
    context --> script
    note right of context : Users selects files in VSCode/CLI.
    script --> prompt
    system --> prompt
    prompt --> api
    api --> tools
    tools --> api
    api --> response
    note left of system: Teach LLM about micro-formats.
    response: response (raw text)
```
