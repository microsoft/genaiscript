---
title: Fence Formats
sidebar:
    order: 90
description: Explore various fence formats supported by GenAIScript for optimal
    LLM input text formatting.
keywords: fence format, LLM input, markdown, xml, GenAIScript
---

GenAIScript supports various types of "fence" formats when rendering [def](/genaiscript/reference/scripts/content) function, since LLMs may behave differently depending on the format of the input text.
**As of 1.82.0, the default format is to use XML tags.**

- [Anthropic](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/use-xml-tags)
- [OpenAI](https://platform.openai.com/docs/guides/prompt-engineering#tactic-use-delimiters-to-clearly-indicate-distinct-parts-of-the-input)
- [Google](https://cloud.google.com/vertex-ai/generative-ai/docs/learn/prompts/structure-prompts)

The following `def` call will generate a fenced region with different syntax:

- `xml`

```js
def("TEXT", ":)", { fenceFormat: "xml" })
```

```markdown
<TEXT>
:)
</TEXT>
```

- `markdown`

```js
def("TEXT", ":)", { fenceFormat: "markdown" })
```

```markdown
TEXT:
\`\`\`
:)
\`\`\`
```

- `none`

```js
def("TEXT", ":)", { fenceFormat: "none" })
```

```text
TEXT:
:)
```

## Referencing a def

If you are using the `xml` format, it is advised to use `<NAME>` when referencing the `def` variable, or use the returned value as the name.

```js
const textName = def("TEXT", ":)", { fenceFormat: "xml" })
$`Summarize ${textName}` // Summarize <TEXT>
```

## Configuriation

GenAIScript will automatically pick a format based on the model. However, you can override the format at the script level.

```js
script({ fenceFormat: "xml" })
```

or at the `def` level:

```js
def("TEXT", ":)", { fenceFormat: "xml" })
```

or through the `--fence-format` flag on the cli:

```sh
npx --yes genaiscript run ... --fence-format xml
```
