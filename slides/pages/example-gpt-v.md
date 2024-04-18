---
layout: image-left

# the image source
image: /plug-in.png
backgroundSize: contain
---

<v-click>

# Example: Translate a Diagram to Text

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
