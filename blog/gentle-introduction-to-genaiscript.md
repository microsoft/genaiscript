
Ever wondered how to leverage the power of AI and Large Language Models (LLMs) in your projects? Look no further! 
This post will introduce you to [GenAIScript](https://microsoft.github.io/genaiscript), a tool designed to simplify the creation of prompts and interactions with LLMs. Let's dive in! 🌊

## What is GenAIScript?

GenAIScript uses a stylized version of JavaScript to generate prompts, which are then sent to an LLM. 
Scripts are stored as files (`genaisrc/*.genai.mjs`), executed to produce the prompt text and structured results (files, diagnostics) are extracted automatically.

## Getting Started

Here's a simple example to get you started. Create a file named `poem.genai.mjs` in the `genaisrc` folder and add the following code:

```js
$`Write a one sentence poem.`
```

When executed, this script will generate the following prompt:

<details>
<summary>👤 User</summary>

```markdown
Write a one sentence poem.
```

</details>

<details open>
<summary>🤖 Assistant</summary>

```markdown
Roses bloom, hearts swoon, under the silver moon.
```

</details>

## Adding Context

GenAIScript can also use context variables, allowing you to interact with files or other data sources. Let's see an example where we define a context variable using `env.files`:

```js
def("FILES", env.files)
$`You are an expert technical writer and proofreader.
Review the documents in FILES and report the 2 most important issues.`
```

Execute this script to see the generated user message and the assistant's response. The context variable `FILES` will contain the list of files in the environment.

<details>
<summary>👤 User</summary>

```markdown
FILES: 
file="src/samples/markdown.md"
What is Markdown?
Markdown is a lightweight markup language that...

You are an expert technical writer and proofreader.
Review the documents in FILES and report the 2 most important issues.
```

</details>

<details open>
<summary>🤖 Assistant</summary>

```markdown
I reviewed the document in "src/samples/markdown.md" 
and found the following two important issues:

1. **Missing Consistency in Heading Styles**: ...
```

</details>

## Metadata and Script Configuration

You can add metadata to your script using the `script` function. This helps in organizing and configuring the script, including specifying the model and other parameters. GenAIScript supports various LLM providers, such as OpenAI, Azure OpenAI,
GitHub Models, Ollama and more.

```js
script({
    title: "Technical proofreading",
    description: "Reviews the text as a tech writer.",
    model: "openai:gpt-4o",
    temperature: 0.1,
})
def("FILES", env.files)
$`You are an expert technical writer and proofreader.
Review the documents in FILES and report the 2 most important issues.`
```

## Next Steps

- [Getting started](https://microsoft.github.io/genaiscript/getting-started/) guide to configure and start using GenAIScript.
- Explore more advanced scripts by following the [Prompt As Code guide](https://microsoft.github.io/genaiscript/guides/prompt-as-code).

There you have it! A gentle introduction to GenAIScript to get you started on your prompt engineering journey. Happy scripting! 💻✨

