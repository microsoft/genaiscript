---
title: Getting Started
sidebar:
    order: 0
description: Start developing with the GenAIScript VS Code Extension to create
    AI scripts efficiently.
keywords:
    - AI Scripting Extension
    - VS Code AI
    - Generative AI Development
    - AI Extension Setup
    - AI Code Automation
genaiscript:
    model: openai:gpt-3.5-turbo
    files: src/samples/markdown-small.txt
---

GenAIScript is a scripting language that integrates LLMs into the scripting process using a simplified JavaScript syntax.
Supported by our VS Code GenAIScript extension, it allows users to create, debug, and automate LLM-based scripts.

## Hello World

A GenAIScript is a JavaScript program that builds an LLM which is then executed by the GenAIScript runtime.
Let's start with a simple script that tells the LLM to generate a poem. In typical use, GenAIScript files
have the naming convention `<scriptname>.genai.mjs` and are stored in the `genaisrc` directory
in a repository. Let's call this script `poem.genai.mjs`.

```js wrap title="poem.genai.mjs"
$`Write a poem in code.`
```

The `$...` syntax is [template literal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals)
that renders to a user message to the LLM prompt. In this example, it would be:

```txt
Write a poem in code.
```

In practice, your script may also import [system scripts](/genaiscript/reference/scripts/system) (automatically or manually specified) that add more messages to the requests.
So the final JSON payload sent to the LLM server might look more like this:

```js
{   ...
    messages: [
        { role: "system", content: "You are helpful. ..." },
        { role: "user", content: "Write a poem in code." }
    ]
}
```

GenAIScripts can be executed from the [command line](/genaiscript/reference/cli) or run with a right-click context
menu selection inside Visual Studio Code. Because a GenAIScript is just JavaScript, 
the execution of a script follows the normal JavaScript evaluation rules. 
Once the script is executed, the generated messages are sent to the LLM server, and the response is processed by the GenAIScript runtime.

```sh wrap
npx --yes genaiscript run poem
```

Here is an example output for this prompt (shortened) that got returned by OpenAI gpt-4o.

````markdown
```python
def poem():
    # In the silence of code,
    ...
# And thus, in syntax sublime,
# We find the art of the rhyme.
```
````

GenAIScript supports extracting structured data and files from the LLM output as we will see later.

:::note

The CLI will scan you project for `*.genai.mjs/mts` files and you can use the filename without the extension to refer to them.

:::

## Variables

GenAIScripts support a way to declare [prompt variables](/genaiscript/reference/scripts/context), which allow to include content into the prompt and to refer to it later in the script.

Let's take a look at a `summarize` script that includes the content of a file and asks the LLM to summarize it.

```js wrap title="summarize.genai.mjs"
def("FILE", workspace.readText("some/relative/markdown.txt"))
$`Summarize FILE in one sentence.`
```

In this snippet, we use `workspace.readText` to read the content of a file (path relatie to workspace root)
and we use `def` to include it in the prompt as a `prompt variable`. We then "referenced" this variable in the prompt.

````markdown wrap title="prompt"
FILE:
```text file="some/relative/markdown.txt"
What is Markdown?

Markdown is a lightweight markup language that you can use to add formatting elements to plaintext text documents. Created by John Gruber in 2004, Markdown is now one of the world’s most popular markup languages.
```
Summarize FILE in one sentence.
````

The `def` function supports many configuration flags to control how the content is included in the prompt. For example, you can insert line numbers or limit the number of tokens.

```js
def("FILE", ..., { lineNumbers: true, maxTokens: 100 })
```

:::note

The variable name (FILE) matters! Make sure it represents the content of the variable or it might confuse the LLM.

:::

## Files parameters

GenAIScript are meant to work on a file or set of files. When you run a script in Visual Studio Code on a file or a folder, those files are passed to the script using the `env.files` variable. You can use this `env.files` to replace hard-coded paths and make your scripts
more resuable.

```js wrap title="summarize.genai.mjs" "env.files"
// summarize all files in the env.files array
def("FILE", env.files)
$`Summarize FILE in one sentence.`
```

And now apply it to a bunch of files

```sh
npx --yes genaiscript run summarize **/*.md
```

## Processing outputs

GenAIScript processes the outputs of the LLM and extracts files, diagnostics and code sections when possible.

Let's update the summarizer script to specify an output file pattern.

```js wrap title="summarize.genai.mjs"
// summarize all files in the env.files array
def("FILE", env.files)
$`Summarize each FILE in one sentence.
  Save each generated summary to "<filename>.summary"`
```

Given this input, the model returns a string, which
the GenAIScript runtime interprets based on what the prompt requested from the model:

````markdown wrap
File src/samples/markdown-small.txt.summary:
```text
Markdown is a lightweight markup language created by John Gruber in 2004, known for adding formatting elements to plaintext text documents.
```
````

Because the prompt requested that a file be written,
the model has responded with content describing the contents of the file that should be created.
In this case, the model has chosen to call that file `markdown-small.txt.summary`.

Our GenAIScript library parses the LLM output, interprets it, and in this case will
create the file. If the script is invoked in VS Code, the
file creation is exposed to the user via a [Refactoring Preview](https://code.visualstudio.com/docs/editor/refactoring#_refactor-preview) or directly saved to the file system.

Of course, things can get more complex - with functions, schemas, ... -, but this is the basic flow of a GenAIScript script.
If you're looking for an exhaustive list of prompting techniques, checkout [the prompt report](https://learnprompting.org/).

## Using tools

[Tools](/genaiscript/reference/scripts/tools) are a way to register JavaScript callbacks with the LLM, they can be used
execute code, search the web, ... or read files!
Here is an example of a script that uses the [`fs_read_file`](/genaiscript/reference/scripts/system#systemfs_read_file) tool to read a file and summarize it:

```js wrap title="summarize.genai.mjs" 'tools: "fs_read_file"'
script({ tools: "fs_read_file" })

$`
- read the file markdown.md 
- summarize it in one sentence. 
- save output to markdown.md.txt
`
```

A possible trace looks like as follows. 

<details style="margin-left: 1rem;"  open>
<summary>Trace</summary>

`````markdown
- prompting github:gpt-4o
- cat src/rag/markdown.md
- prompting github:gpt-4o

FILE ./markdown.md.txt:
```text
Markdown is a lightweight ...
```
`````

</details>

As you can see we are not using the `def` function anymore, we expect the LLM to issue a call to the `fs_read_file` tool to read the file `markdown.md` so that it receives the content of that file.

Note that this approach is less deterministic than using `def` as the LLM might not call the tool. Moreover it uses more tokens as the LLM has to generate the code to call the tool. Nonetheless, it is a powerful way to interact with the LLM.

## Using agents

You can add one more layer of indirection and use [agent_fs](/genaiscript/reference/scripts/system#systemagent_fs), a file system [agent](/genaiscript/reference/scripts/agents), to read the file. The agent combines a call to an LLM, and a set of tools related to file system queries.

```js wrap title="summarize.genai.mjs" "agent_fs" 'tools: "agent_fs"'
script({ tools: "agent_fs" })

$`
- read the file src/rag/markdown.md 
- summarize it in one sentence. 
- save output to file markdown.md.txt (override existing)
`
```

<details style="margin-left: 1rem;"  open>
<summary>Trace</summary>

`````markdown
- prompting github:gpt-4o (~1569 tokens)
- agent fs: read and summarize file src/rag/markdown.md in one sentence 
  - prompt agent memory query with github:gpt-4o-mini: "NO_ANSWER"
  - prompt agent fs with github:gpt-4o (~422 tokens)
  - cat src/rag/markdown.md
  - prompting github:gpt-4o (~635 tokens)

```md
The file "src/rag/markdown.md" explains that Markdown...
```

- prompting github:gpt-4o (~1625 tokens)

I'll save the summary to the file `markdown.md.txt`.

FILE markdown.md.txt:
```
The file "src/rag/markdown.md" explains that Markdown....
```
`````
</details>

## Next steps

While GenAIScripts can be written with any IDE and run from the command line,
users of the [extension in Visual Studio Code](/genaiscript/getting-started/installation)
greatly benefit from the additional support for writing, debugging, and executing
GenAIScript provided. We strongly recommend starting by installing the extension.
