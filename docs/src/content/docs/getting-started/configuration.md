---
title: Configuration
description: Set up your LLM connection and authorization with environment variables for seamless integration.
keywords: LLM setup, API configuration, environment variables, secure authorization, LLM integration
sidebar:
    order: 2
---

You will need to configure the LLM connection and authorizion secrets. GenAIScript uses a `.env` file to store the secrets (this file should never be commited to your source control!)

```txt title=".env"
OPENAI_API_KEY="..."
```

GenAiScript supports OpenAI, Azure OpenAI, as well as locally-hosted models. See [authorization information](/genaiscript/reference/token).

## Next steps

Write your [first script](/genaiscript/getting-started/your-first-genai-script).