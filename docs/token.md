# OpenAI or Llama Token

GPTools will automatically ask you for a token when needed and will store it in the workspace secret storage. The token is **never** stored in the clear or shared outside the project.

<!-- Requesting the OpenAI request](./images/token.png) -->

The token will be cleared once we detect it expired; but you can also _forget_ the token by using the `GPTools - Clear OpenAI Token` command.

<!-- Command to clear the token](./images/cleartoken.png) -->

Following token formats are supported:

-   `sk-???` will use https://api.openai.com/v1/
-   `https://???.openai.azure.com#key=???` will use Azure OpenAI endpoint
-   in fact, `https://???.???#key=???` will also assume Azure OpenAI endpoint
-   you can also paste a `curl` or similar invocation and we'll try to parse it out
-   if you use `https://???.???#tgikey=???` we'll assume
    [HuggingFace Text Generation Inference](https://github.com/huggingface/text-generation-inference),
    currently only Llama Instruct models are supported; the key is sent as `api-key` header
