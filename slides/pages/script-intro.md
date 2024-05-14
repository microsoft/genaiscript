---
layout: two-cols
---

## GenAIScript Introduction

Each GenAIScript is JavaScript that defines a call/return to an LLM

- Define context for the LLM using \
`def` (from code, docs, URLs, images, etc)
- Describe the task you want in `$` prompt
- Send the request to the LLM
- Process the output of the LLM 
&nbsp;

::right::

## Example

```js
// metadata and model configuration
script({ title: "Summarize", model: "gpt4" })

// insert the context, define a "FILE" variable
def("FILE", env.files)
def("FILE", await workspace.findFile("**/*.txt"))

// appends text to the prompt (file is the variable name)
$`Summarize FILE. Save output to summary.txt`
```