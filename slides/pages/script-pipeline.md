```mermaid { scale: 0.6 }
stateDiagram
    context: files (text, PDF, DOCX, ...)
    script : user script (.genai.js)
    prompt : prompt (system+user messages)
    system: system script (system.*.genai.js)
    context --> script
    note right of context : Users selects files in VSCode/CLI.
    script --> prompt
    system --> prompt
    note right of system: Teach LLM about micro-formats.
    prompt --> api
    api --> response
    api: LLM API
    api --> tools
    tools --> api    
    prompt --> run_prompt
    run_prompt --> prompt : LLM (OpenAI Chat API)
    run_prompt: inner prompts
    run_prompt --> inner_tools
    inner_tools --> run_prompt
    inner_tools: tools
    inner_tools --> inner2_prompts
    inner2_prompts --> inner_tools
    inner2_prompts: more prompts...
    response: response (text)
    files: files (workspace edits)
    data: data (JSON, YAML, CSV, ...)
    annotations: annotations (error, warning, ...)
    note right of files: Full, diff\nRefactoring preview
    note right of annotations: GitHub Actions,\nVSCode diagnostics, ...
    response --> files
    files --> data
    response --> annotations
```
