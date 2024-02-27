---
title: Getting Started
description: A short introducation on GenAIScript.
---

GenAIScript lets you write javascript script that generate rich interaction with LLMs
and automate them.

```js
script({
    title: "Shorten", // displayed in UI and Copilot Chat
    // also displayed, but grayed out:
    description:
        "A prompt that shrinks the size of text without losing meaning",
})

// you can debug the generation using goo'old logs
console.log("this shows up in the `console output` section of the trace")

// but the variable is appropriately delimited
def("FILE", env.files)

// this appends text to the prompt
$`Shorten the following FILE. Limit changes to minimum. Respond with the new FILE.`
```


## Further reading

- Read the [reference](/genaiscript/reference/)
