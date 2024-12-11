
import { Image } from "astro:assets"
import { Code } from "@astrojs/starlight/components"
import scriptSource from "../../../../../../packages/sample/genaisrc/samples/copilotchat.genai.mjs?raw"
import src from "../../../../assets/chat-participant.png"
import alt from "../../../../assets/chat-participant.png.txt?raw"

The `@genaiscript` [chat participant](https://code.visualstudio.com/api/extension-guides/chat#parts-of-the-chat-user-experience) lets your run scripts without the context
of a [GitHub Copilot Chat](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot-chat) conversation.
This is useful for leverage existing scripts in an interactive chat session.

<Image src={src} alt={alt} loading="lazy" />

## Choosing which script to run

The `/run` command expects a script id as the first argument (e.g., `/run poem`). The rest of the query is
passed to the script as the `env.vars.question` variable.

```sh
@genaiscript /run summarize
```

If you omit the `/run` command, GenAIScript will look for a script named `copilotchat`. If it finds one, it will run it.
Otherwise, it will ask you to pick a script from the list of available scripts.

```sh
@genaiscript add comments to the current editor
```

## Context

The context selected by the user in Copilot Chat is converted to variables and passed to the script:

-   the prompt content is passed in `env.vars.question`. The script id is removed in the case of `/run`.
-   the current editor text is passed in `env.vars["copilot.editor"]`
-   the current editor selection is passed in `env.vars["copilot.selection"]`
-   all other file references are passed in `env.files`

### Examples

-   `mermaid` will generate a diagram from the user prompt.

```js title="mermaid.genai.mjs" wrap
def("CODE", env.files)
$`Generate a class diagram using mermaid of the code symbols in the CODE.`
```

- `websearcher` will search the web for the user prompt
and use the file in context in the answer.

```js title="websearcher.genai.mjs" wrap
const res = await retrieval.webSearch(env.vars.question)
def("QUESTION", env.vars.question)
def("WEB_SEARCH", res)
def("FILE", env.files, { ignoreEmpty: true})
$`Answer QUESTION using WEB_SEARCH and FILE.`
```

-   `dataanalyst` uses the Python code interpreter tools to
    resolve a data computation question.

```js title="dataanalyst.genai.mjs" wrap
script({
    tools: [
        "fs_read_file",
        "python_code_interpreter_copy_files_to_container",
        "python_code_interpreter_read_file",
        "python_code_interpreter_run",
    ],
})
def("DATA", env.files.map(({ filename }) => filename).join("\n"))
def("QUESTION", env.vars.question)

$`Run python code to answer the data analyst question 
in QUESTION using the data in DATA.
Return the python code that was used to compute the answer.
`
```

### History

The history of messages is passed in `env.vars["copilot.history"]`. It is an array of `HistoryMessageUser | HistoryMessageAssistant`:

```json
[
    {
        "role": "user",
        "content": "write a poem"
    },
    {
        "role": "assistant",
        "content": "I am an assistant"
    }
]
```

## Default script <a id="copilotchat" href="" />

The following script can used as a starter template to create the default script when the user does not use the `/run` command.

<Code
    code={scriptSource}
    wrap={true}
    lang="ts"
    title="genaisrc/copilotchat.genai.mts"
/>

## Unsupported features

The following features are currently not supported in the chat participant:

-   Tools (`#tool`)
-   `Workspace` reference
