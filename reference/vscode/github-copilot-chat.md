import { Image } from "astro:assets"
import { YouTube } from "astro-embed"
import { Code } from "@astrojs/starlight/components"
import scriptSource from "../../../../../../packages/sample/genaisrc/samples/copilotchat.genai.mjs?raw"
import src from "../../../../assets/chat-participant.png"
import alt from "../../../../assets/chat-participant.png.txt?raw"
import { Steps } from "@astrojs/starlight/components"

GenAIScript integrates with [GitHub Copilot Chat](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot-chat)
by providing a **chat participant** that allows you to run scripts in the context of a chat conversation,
and a **custom prompt** to generate GenAIScript more efficiently with Copilot Chat.

## `@genaiscript` chat participant

The `@genaiscript` [chat participant](https://code.visualstudio.com/api/extension-guides/chat#parts-of-the-chat-user-experience) lets your run scripts without the context
of a [GitHub Copilot Chat](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot-chat) conversation.
This is useful for leverage existing scripts in an interactive chat session.

<Image src={src} alt={alt} loading="lazy" />

### Choosing which script to run

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

### Choosing the model

If your script does not specify a model, GenAIScript will prompt you to choose a model.
You can specify which model to choose in the script configuration as well using the `github_copilot_chat` provider.

- current selected model: `github_copilot_chat:current`

```js "github_copilot_chat:current"
script({
    model: "github_copilot_chat:current",
})
```

- gpt-4o-mini: `github_copilot_chat:gpt-4o-mini`

```js "github_copilot_chat:gpt-4o-mini"
script({
    model: "github_copilot_chat:gpt-4o-mini",
})
```

When GenAIScript prompts you to choose a model, it will store your choices in the workspace settings
under the

```json file=".vscode/settings.json"
{
    "genaiscript.languageChatModels": {
        "gpt-4o": "gpt-4o-2024-11-20"
    }
}
```

:::note

**The GitHub Copilot Chat models are only available in Visual Studio Code.** They will not work from
the [cli](/genaiscript/reference/cli) or [playground](/genaiscript/reference/playground) interfaces.

:::

#### Model availability

Not all models listed in the GitHub Copilot Chat user interface are available for 3rd party extensions.
When GenAIScript tries to access a model that is not available, it will notify you but it does not have
over your model access configuration.

### Context

The context selected by the user in Copilot Chat is converted to variables and passed to the script:

- the prompt content is passed in `env.vars.question`. The script id is removed in the case of `/run`.
- the current editor text is passed in `env.vars["copilot.editor"]`
- the current editor selection is passed in `env.vars["copilot.selection"]`
- all other file references are passed in `env.files`

#### Examples

- `mermaid` will generate a diagram from the user prompt.

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
def("FILE", env.files, { ignoreEmpty: true })
$`Answer QUESTION using WEB_SEARCH and FILE.`
```

- `dataanalyst` uses the Python code interpreter tools to
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

#### History

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

### Continued conversation

You can use the `@genaiscript` chat to weave the execution of a script into an existing conversation
or to continue the conversation with Copilot with the results of the script. The results
of the script are placed back into the chat history and are available to any copilot later on.

- `@genaiscript /run tool` will run the `tool` script and place the results back into the chat history.
- `analyze the results` will continue the conversation with the results of the script.

### Default script <a id="copilotchat" href="" />

The following script can used as a starter template to create the default script when the user does not use the `/run` command.

<Code
    code={scriptSource}
    wrap={true}
    lang="ts"
    title="genaisrc/copilotchat.genai.mts"
/>

### Unsupported features

The following features are currently not supported in the chat participant:

- Tools (`#tool`)
- `Workspace` reference

## `genaiscript` custom instructions <a href="" id="genaiscript-custom-prompt" />

GenAIScript will automatically save an instructions.md file in the `.genaiscript/instructions` folder
when you run a script. This file contains the instructions used to generate the script.

### Augmented chat sessions

This is how you start chat sessions using the `genaiscript` prompt.

<Steps>

<ol>

<li>

Select the **Attach Context** 📎icon (`Ctrl+/`), then select **Instructions...**,
then select the **genaiscript.instructions.md** prompt.

</li>

<li>

Include instructions to write a script or answer a question about GenAIScript,
`write a script that summarizes a video`.

</li>

</ol>

</Steps>

Since the prompt injects the entire documentation of GenAIScript (700+kb at this time of writing),
you'll want to use a model with a large context like Sonnet or Gemini.

Also remember that the entire conversation is sent back on each iteration, so this technique
works best as a one-shot detailed request.