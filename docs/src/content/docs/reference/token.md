---
title: Authorization
order: 2
description: Learn how to set up authorization tokens for API access in your project using environment variables and .env files.
keywords: authorization, token, environment variables, .env, API access
---

GenAIScript will try to find the connection token from various sources:

-   a `.env` file in your root project.
-   process environment variables from the CLI , typically in your CI/CD environment.

## .env file

The extension also supports the following set of variables:

-   `OPENAI_API_TYPE`, `OPENAI_API_BASE`, `OPENAI_API_KEY`, `OPENAI_API_VERSION` variables.
-   `AZURE_OPENAI_API_ENDPOINT` or `AZURE_OPENAI_API_BASE`, `AZURE_OPENAI_API_KEY` variables.
-   `AZURE_API_BASE`, `AZURE_API_KEY`, `AZURE_API_VERSION` variables.

```txt title=".env"
OPENAI_API_TYPE="azure"
OPENAI_API_BASE="https://mywebsite.azurewebsites.net"
OPENAI_API_KEY="oaip_SomethingSecret"
```

Aditionaly

-   the `OPENAI_API_BASE` can point to a local server, e.g. using [https://jan.ai/api-reference/](https://jan.ai/api-reference/) at `http://localhost:1337/v1`.
-   the `OPENAI_API_TYPE` should be `azure` or `local`. If not specified, we'll try to guess based on the `OPENAI_API_BASE` value.

:::caution[Don't commit your secrets]

If you are using git to manage your project, make sure to add the `.env` file to your `.gitignore` file to avoid committing your secrets to your repository.

```txt title=".gitignore"
...
.env
```

:::