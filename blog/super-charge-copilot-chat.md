import { Code } from "@astrojs/starlight/components"
import { YouTube } from "astro-embed"
import BlogNarration from "../../../components/BlogNarration.astro"

<BlogNarration />

:::note

Visual Studio Code v100 changed slightly the way to add the `genaiscript` prompt is added to the chat session.

- [Follow this guide](/genaiscript/reference/vscode/github-copilot-chat/#genaiscript-custom-prompt)

:::

Do you know to know an awesome trick to make GitHub Copilot Chat an expert in GenAIScript?
Here's how you can supercharge your Copilot chat with simple technique.

**Add your entire documentation to the chat session!**

Sounds crazy? Not really! The GenAIScript contains countless examples and examples of usage of APIs. It just needs to be compressed
to fit into the context window.

## How do I try this?

With the latest release of GenAIScript, you can now add a **`genaiscript`** prompt to your chat session.
This prompt, crafted by the GenAIScript team, will include the GenAIScript documentation
into the context to help the LLM provider better answers.

<YouTube id="https://youtu.be/0GkbxnW0J34" posterQuality="high" />

- [Follow this guide](/genaiscript/reference/vscode/github-copilot-chat/#genaiscript-custom-prompt)

## How it works?

The release of the latest GitHub Copilot Chat is adding support for [reusable prompts](https://code.visualstudio.com/docs/copilot/copilot-customization#_reusable-prompt-files-experimental).
GitHub Copilot Chat also added support for local workspace indexing, which helps with handling large amount of context.

GenAIScript leverages these features by adding a custom prompt that includes the GenAIScript documentation.

## To be continued

This technique is really new and there's probably lots of improvement to be done.