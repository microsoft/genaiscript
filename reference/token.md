
GenAIScript will try to find the connection token from various sources:

-   a `.env` file in the root of your project (VSCode and CLI)
-   environment variables, typically within your CI/CD environment (CLI only)
-   Visual Studio Language Chat Models (VSCode only)

## .env file or process environment

The extension also supports the following set of variables:

-   The `OPENAI_API_TYPE`, `OPENAI_API_BASE`, `OPENAI_API_KEY`, `OPENAI_API_VERSION` variables.
-   Either `AZURE_OPENAI_API_ENDPOINT` or `AZURE_OPENAI_API_BASE`, and `AZURE_OPENAI_API_KEY` variables.
-   The `AZURE_API_BASE`, `AZURE_API_KEY`, `AZURE_API_VERSION` variables.

```txt title=".env"
OPENAI_API_KEY="oaip_SomethingSecret"
```

Additionally,

-   The `OPENAI_API_BASE` can point to a local server, for example, `http://localhost:1337/v1` as seen at [https://jan.ai/api-reference/](https://jan.ai/api-reference/).
-   The `OPENAI_API_TYPE` should be either `azure` or `local`. If not specified, the system will attempt to infer it based on the `OPENAI_API_BASE` value.

:::caution[Don't commit your secrets]

If you are using Git to manage your project, ensure that the `.env` file is added to your `.gitignore` to prevent committing your secrets to the repository.

```txt title=".gitignore"
...
.env
```

:::

### Multiple .env files

You can override the default `.env` file name by adding the `--env myother.env` file.

### Listing model configuration

Run the `script model` command to list the available scripts and their model configuration. This can be useful to diagnose configuration issues in CI/CD environments.

```sh
npx genaiscript scripts model [script]
```

where [script] can be a script id or a file path.
