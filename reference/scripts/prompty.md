
GenAIScript supports running [.prompty](https://prompty.ai/) files as scripts (with some limitations) or importing them in a script.

## What is prompty?

[Prompty](https://prompty.ai/) is a markdown-ish file format to store a parameterized prompts along with model information.

```markdown title="basic.prompty"
---
name: Basic Prompt
description: A basic prompt that uses the chat API to answer questions
model:
    api: chat
    configuration:
        type: azure_openai
        azure_deployment: gpt-4o
    parameters:
        max_tokens: 128
        temperature: 0.2
inputs:
    question:
        type: string
sample:
    "question": "Who is the most famous person in the world?"
---

system:
You are an AI assistant who helps people find information.
As the assistant, you answer questions briefly, succinctly.

user:
{{question}}

{{hint}}
```

There are two ways to leverage prompty files with GenAIScript:

-   run them directly through GenAIScript
-   import them in a script using `importTemplate`

## Running .prompty with GenAIScript

You can run a `.prompty` file from the [cli](/genaiscript/reference/cli) or Visual Studio Code as any other `.genai.mjs` script.

GenAIScript will convert the `.prompty` content as a script and execute it. It supports most of the front matter options but mostly ignores the model configuration section.

This is what the `basic.prompty` file compiles to:

```js wrap title="basic.prompty.genai.mts"
script({
    model: "azure:gpt-4o",
    title: "Basic Prompt",
    description: "A basic prompt that uses the chat API to answer questions",
    parameters: {
        question: {
            type: "string",
            default: "Who is the most famous person in the world?",
        },
    },
    temperature: 0.2,
    maxTokens: 128,
})

writeTesxt(
    `You are an AI assistant who helps people find information.
As the assistant, you answer questions briefly, succinctly.`,
    { role: "system" }
)
$`{{question}}

{{hint}}`.jinja(env.vars)
```

## Importing .prompty

You can also import and render a .prompty file at runtime while generating the prompt using `importTemplate`.

```ts
importTemplate("basic.prompty", {
    question: "what is the capital of france?",
    hint: "starts with p",
})
```

In this scenario, the `.prompty` file is not executed as a script but imported as a template. The `importTemplate` function will render the template with the provided parameters.

### Supported features

-   `name`, `description`, `temperature`, `max_tokens`, `top_p`, ...0
-   `inputs` converted to `parameters`
-   `sample` value populates the parameters `default` section
-   `outputs` converted to `responseSchema`
-   [Jinja2](https://www.npmjs.com/package/@huggingface/jinja) template engine

### Limitations

-   model configuration uses GenAIScript `.env` file (see [configuration](/genaiscript/getting-started/configuration)).
-   images are not yet supported

### Extensions

Extra fields that genaiscript use:

-   `files` to specify one or many files to populate `env.files`
-   `tests` to specify one or many tests
