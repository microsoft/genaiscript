---
layout: two-cols-header
---
# GenAIScript Example: Translate Any Diagram to Text

::left::

![The image is a flowchart depicting the process of a system using plugins and a language learning model (LLM) to generate a final answer. The process begins with initialization and proceeds through various steps where the LLM picks a plugin, runs the plugin with inputs such as web, emails, etc., and then processes the result. This cycle can repeat as needed before the system generates the final answer. The flowchart includes several labeled elements such as "Plugin List," "User Prompt," "System Prompt," "Training Data," "Exec," "Result," and "Analyze." These elements are connected by arrows indicating the flow of information and decision-making through the system. The flowchart is organized into rows labeled "External," "Plugin," "Copilot," and "LLM," which represent different levels or components of the system.](/plug-in.png)

::right::

<v-click>

```js
script({
    title: "explain-diagram",
    description: "Given an image of a diagram,
    explain what it contains",
    model: "gpt-4-turbo-v",
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
