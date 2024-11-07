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

## Writing a GenAIScript

A GenAIScript contains JavaScript that uses a library of operations we've defined
plus an LLM prompt. The prompt is written with a JavaScript string template `$ ... ` that
allows the user to interleave the contents of JavaScript variables with the
natural language of the prompt. Our library also makes it easy to import documents into the LLM prompt and helps parse the output of the LLM after running the prompt.

The following script, which summarizes the content of any document passed to it as an
argument, illustrates all of these capabilities. (Note that in typical use, GenAIScripts
have the naming convention `<scriptname>.genai.mjs` and are stored in the `genaisrc` directory
in a repository).

```js wrap title="summarize.genai.mjs"
// context: define a "FILE" variable
const file = def("FILE", env.files)
// task: appends text to the prompt (file is the variable name)
$`Summarize ${file} in one sentence. Save output to ${file}.summary`
```

Our library's JavaScript [`def`](/genaiscript/reference/scripts/context) command puts
the contents of a document into the
LLM prompt and defines a name that
can be used in the prompt to refer to that document, which is the value returned by `def` (e.g., `FILE`, the first argument to `def`).

`env.files` is a built-in variable that GenAIScript defines that is bound
to the arguments to the script that are either passed on the command-line or
by right-clicking to invoke the script in VS Code.

The prompt `$ ... ` is a template string that allows JavaScript variables (e.g, `file`) to be embedded
into the string conveniently. In our example, the prompt that is sent to the LLM
is "Summarize FILE in one sentence. Save output to FILE.summary".

`def` can take documents with different formats as input (.txt, .pdf, .docx) so
in our example, the input file could be one of many different document formats, making the
script general.

# Executing a GenAIScript

GenAIScripts can be executed from the command line or run with a right-click context
menu selection inside VS Code. Because a GenAIScript is just JavaScript, the execution of a script follows the normal JavaScript evaluation rules with the exception that when a prompt is present, `$ ... `, that prompt is treated
by the GenAIScript runtime as a function call to the AI model defined in in the script metadata. To execute the prompt,
the `$ ... ` prompt is augmented with additional content,
including any documents defined by `def` and other built-in prompt messages that GenAIScript
defines and then is sent to the user-defined AI model. In our example, this is what is
sent to the LLM given an input file `markdown-small.txt` that contains information
about the history of markdown:

<!-- genaiscript output start -->

<details style="margin-left: 1rem;"  open>
<summary>👤 Content sent to model</summary>

````markdown wrap
FILE:

```txt file="src/samples/markdown-small.txt"
What is Markdown?

Markdown is a lightweight markup language that you can use to add formatting elements to plaintext text documents. Created by John Gruber in 2004, Markdown is now one of the world’s most popular markup languages.
```

Summarize FILE in one sentence. Save output to FILE.summary
````

</details>

Given this input, the model returns a string, which
the GenAIScript runtime interprets based on what the prompt requested from the model:

<details style="margin-left: 1rem;"  open>
<summary>🤖 Content returned from model</summary>

````markdown wrap
File src/samples/markdown-small.txt.summary:

```txt
Markdown is a lightweight markup language created by John Gruber in 2004, known for adding formatting elements to plaintext text documents.
```
````

</details>

<!-- genaiscript output end -->

Because the prompt requested that a file be written ("Save the output to FILE.summary"),
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

- prompting github:gpt-4o
- cat src/rag/markdown.md
- prompting github:gpt-4o

````` wrap
Saving this summary to the file `markdown.md.txt`.

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

- prompting github:gpt-4o (~1569 tokens)
- agent fs: read and summarize file src/rag/markdown.md in one sentence 
  - prompt agent memory query with github:gpt-4o-mini: "NO_ANSWER"
  - prompt agent fs with github:gpt-4o (~422 tokens)
  - cat src/rag/markdown.md
  - prompting github:gpt-4o (~635 tokens)

```
The file "src/rag/markdown.md" explains that Markdown...
```

- prompting github:gpt-4o (~1625 tokens)

`````
I'll save the summary to the file `markdown.md.txt`.

FILE markdown.md.txt:
``` wrap
The file "src/rag/markdown.md" explains that Markdown....
```
`````
</details>

## Next steps

While GenAIScripts can be written with any IDE and run from the command line,
users of the [extension in Visual Studio Code](/genaiscript/getting-started/installation)
greatly benefit from the additional support for writing, debugging, and executing
GenAIScript provided. We strongly recommend starting by installing the extension.
