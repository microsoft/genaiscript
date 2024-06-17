---
title: Prompt As Code
description: Tutorial on using GenAIScript runtime and syntax to assemble prompts
sidebar:
  order: 0
genaiscript:
  files: src/samples/markdown.md
  model: openai:gpt-3.50-turbo
---

This page is a tutorial on creating prompt with GenAIScript. It is designed to be opened
in Visual Studio Code as a Notebook.

1. Follow the steps in [installation](/genaiscript/getting-started/installation) and
[configuration](/genaiscript/getting-started/configuration) to set up your environment.

2. Right click on this file and select **Open With...**, then **GenAIScript Markdown Notebook**
to edit this file as a Notebook.

## About GenAIScript Markdown Notebooks

The [GenAIScript Markdown Notebook](/genaiscript/reference/scripts/notebook) will parse the markdown document into a Notebook view and use Visual Studio Code's support to provide a rich editing experience. It should work with any markdown file as long as the code fence use "```".

- Each **JavaScript** code block is an self-contained GenAIScript that can be executed individually. The results are attached to each code block and saved in the markdown file.
- This is a stateless kernel, so the variables are not shared between code blocks.
- Other languages are not supported in this notebook and simply ignored.

## Prompt as code

GenAIScript lets you write prompts as a JavaScript program. GenAIScript runs your program; generate chat messages; then handles the remaining interaction with the LLM API.

Let's start with a simple hello world program.

```js
$`Say "hello!" in emojis`
```

<!-- genaiscript output start -->

<details>
<summary>👤 user</summary>


```markdown wrap
Say "hello!" in emojis
```


</details>


<details open>
<summary>🤖 assistant </summary>


```markdown wrap
👋😃!
```


</details>

<!-- genaiscript output end -->



The `$` function formats the strings and write them to the user message. This user message is added to the chat messages and sent to the LLM API. Under the snippet, you can review both the **user** message (that our program generated) and the **assistant** (LLM) response.

You can run the code block by clicking the **Execute Cell** button on the top left corner of the code block. It will be default try to use the `openai:gpt-3.5-turbo` LLM. If you need to use a different model, update the `model` field in the front matter at the start of the document. There are many options documented in [configuration](/genaiscript/getting-started/configuration).

Once the execution is done, you will also an additional **trace** entry that allows you to dive in the internal details of the GenAIScript execution. This is very helpful to diagnose issues with your prompts. The trace can be quite large so it is not serialized in the markdown file.

You can sequence multiple `$` calls to append text to the user message. You can also inner expression to generate dynamic content.

```js
// let's give 3 tasks to the LLM
// to get 3 different outputs
for(let i = 1; i <= 3; i++)
  $`- Say "hello!" in ${i} emojis.`
$`Respond with a markdown list`
```

<!-- genaiscript output start -->

<details>
<summary>👤 user</summary>


```markdown wrap
- Say "hello!" in 1 emojis.
- Say "hello!" in 2 emojis.
- Say "hello!" in 3 emojis.
Respond with a markdown list
```


</details>


<details open>
<summary>🤖 assistant </summary>


```markdown wrap
- 👋
- 👋😊
- 👋✨😃
```


</details>

<!-- genaiscript output end -->


