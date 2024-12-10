
[Tools](/genaiscript/reference/scripts/tools) is a powerful feature of LLM models
that allows you to augment the LLM reasoning with external tools.

These days, many LLM models come with a built-in support for tools. However, some of them
don't... like [OpenAI's o1-preview and o1-mini](https://platform.openai.com/docs/guides/reasoning).

## Fallback tools

With GenAIScript 1.72.0, we introduce the concept of **fallback tools**.
Basically, it consists of a [system script](/genaiscript/reference/scripts/system#systemtool_calls) that "teaches" the LLM model about available tools and how to call them.

```js wrap
$`## Tool support

You can call external tools to help generating the answer of the user questions.

- The list of tools is defined in TOOLS. Use the description to help you choose the best tools.
- Each tool has an id, description, and a JSON schema for the arguments.
...

\`\`\`tool_calls
<tool_id>: { <JSON_serialized_tool_call_arguments> }
<tool_id_2>: { <JSON_serialized_tool_call_arguments_2> }
...
\`\`\`
```

:::note

The performance of this feature will vary greatly based on the LLM model you decide to use.

:::

## A tool example

Here is an example of a tool that generates a random number between 0 and 1.

```js
defTool("random", "Generate a random number", {}, () => Math.random())
$`Generate a random number between 0 and 1.`
```

-   o1-mini trace (using GitHub Models)

````txt
prompting github:o1-mini (~490 tokens)
```tool_calls
random: {}
```

prompting github:o1-mini (~532 tokens)
Your random number between 0 and 1 is **0.7792901036554349**.
````

-   gemma2 model (using Ollama)

````txt
prompting ollama:gemma2 (~716 tokens)

```tool_calls
random: {}
```
prompting ollama:gemma2 (~758 tokens)

The random number is 0.9552638470626966.


Let me know if you'd like to generate another random number!
````

## Activation

The fallback tool mode is automatically activated for known LLM models that don't support tools natively. The list is not complete
so open an issue if you stumble upon a model that should have fallback tools enabled.

It can also be activated manually (see [documentation](/genaiscript/reference/scripts/tools#fallback_tools)).
