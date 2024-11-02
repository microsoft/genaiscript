---
layout: two-cols-header
---

# GenAIScript Example: Translate Any Diagram to Text

::left::

![Flowchart depicting a process involving an LLM (Language Learning Model) interacting with plugins and external sources to generate a final answer.](/plug-in.png)

::right::

<v-click>

```js
script({
    title: "explain-diagram",
    description: "Given an image of a diagram,
    explain what it contains",
    model: "gpt-4o",
})

defImages(env.files)

$`You are a helpful assistant. Your goal
is to look at the image provided and write
a description of what it contains. You
should infer the context of the diagram,
and write a thorough description of what
the diagram is illustrating.`
```

</v-click>
