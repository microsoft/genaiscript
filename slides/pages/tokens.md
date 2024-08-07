### Where do I get LLM tokens?

```mermaid {scale: 0.9}
graph TD
    A[Do you have a large GPU?] -->|Yes| B[Local LLM]
    A -->|No| C[Is it for personal use?]
    C -->|Yes| D[OpenAI]
    C -->|No| E[Do you have Azure OpenAI?]
    E -->|Yes| F[Azure OpenAI]
    E -->|No| G[Do you have GitHub?]
    G -->|Yes| H[GitHub Models in Codespace]
    G -->|Yes| I[GitHub Copilot]
    G -->|No| K[😢]
```
