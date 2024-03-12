---
title: Configuration
description: Learn how to set up LLM connection and authorization for GenAIScript using environment variables.
keywords: configuration, environment setup, API key, authorization, LLM connection
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