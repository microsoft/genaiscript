# OpenAI or Llama Token

GPTools will try to find the connection token from various sources:

-   a `.env` file in your root project.
-   workspace secrets when using the Visual Studio Code extension
-   process environment variables from the CLI

## Visual Studio Code secrets

GPTools will automatically ask you for a token when needed and will store it in the workspace secret storage. The token is **never** stored in the clear or shared outside the project.
The token will be cleared once we detect it expired; but you can also _forget_ the token by using the `GPTools - Clear OpenAI Token` command.

The extension also support a root `.env` file in your project.

## Token Formats

Following token formats are supported in the `GPTOOLS_TOKEN` environment variables:

-   `sk-???` will use https://api.openai.com/v1/
-   `https://???.openai.azure.com#key=???` will use Azure OpenAI endpoint
-   in fact, `https://???.???#key=???` will also assume Azure OpenAI endpoint
-   you can also paste a `curl` or similar invocation and we'll try to parse it out
-   if you use `https://???.???#tgikey=???` we'll assume
    [HuggingFace Text Generation Inference](https://github.com/huggingface/text-generation-inference),
    currently only Llama Instruct models are supported; the key is sent as `api-key` header

The extension also supports `OPENAI_API_TYPE`, `OPENAI_API_BASE`, `OPENAI_API_KEY` variables.
