---
layout: image-left
image: /langchain-summarize.png
---

# Summarize: 
# Langchain vs GenAIScript

<v-click>

- **ANY** file type
- Write the result to file "summary.md"

```js
script({
    title: "summarize any file"
})

def("FILE", env.files)

$`Write a summary of FILE in summary.md`
```

</v-click>
