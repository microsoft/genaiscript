# OpenAI or Llama Token

GenAIScript will try to find the connection token from various sources:

-   a `.env` file in your root project.
-   process environment variables from the CLI

## .env file

The extension also supports the following set of variables:

-   `OPENAI_API_TYPE`, `OPENAI_API_BASE`, `OPENAI_API_KEY`, `OPENAI_API_VERSION` variables.
-   `AZURE_OPENAI_API_ENDPOINT` or `AZURE_OPENAI_API_BASE`, `AZURE_OPENAI_API_KEY` variables.
-   `AZURE_API_BASE`, `AZURE_API_KEY`, `AZURE_API_VERSION` variables.

Aditionaly

-   the `OPENAI_API_BASE` can point to a local server, e.g. using [https://jan.ai/api-reference/](https://jan.ai/api-reference/) at `http://localhost:1337/v1`.
-   the `OPENAI_API_TYPE` should be `azure` or `local`. If not specified, we'll try to guess based on the `OPENAI_API_BASE` value.

## Connection string Formats

Following connection string formats are supported in the `GENAISCRIPT_TOKEN` environment variables:

-   `sk-???` will use https://api.openai.com/v1/
-   `https://???.openai.azure.com#key=???` will use Azure OpenAI endpoint
-   in fact, `https://???.???#key=???` will also assume Azure OpenAI endpoint
-   you can also paste a `curl` or similar invocation and we'll try to parse it out
-   if you use `https://???.???#tgikey=???` we'll assume
    [HuggingFace Text Generation Inference](https://github.com/huggingface/text-generation-inference),
    currently only Llama Instruct models are supported; the key is sent as `api-key` header
