
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