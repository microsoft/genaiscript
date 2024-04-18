

# Response x Parsers = Files + Data

- parse file edits (as refactoring preview in VSCode)
- parse diagnostics (error, warning, note)
- parse data + schema validation + error repair

```mermaid {scale:0.8}

stateDiagram
  direction LR
    response: response (text)
    files: files (workspace edits)
    data: data (JSON, YAML, CSV, ...)
    annotations: annotations (SARIF, ...)
    note right of data: Schema validation\nTypeChat approach
    note right of files: Full, diff\nRefactoring preview
    note right of annotations: GitHub Actions,\nGitHub Security Alerts,\nVSCode diagnostics, ...
    LLM: ...
    LLM --> response
    response --> files
    files --> data
    response --> annotations
```