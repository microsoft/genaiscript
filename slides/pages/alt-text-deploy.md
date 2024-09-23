---
layout: two-cols-header
---

# Script Automation for Alt-Text


::left::

## Image Alt-Text Script

```js
script({
    title: "Image Alt Text generator",
    model: "gpt-4-turbo-v",
})

const file = env.files[0]

// skip if alt-text file already exists
const txt = await workspace.readText(file.filename + ".txt")

// context
defImages(file)
// task
$`You are an expert in assistive technology. You will analyze each image
and generate a description alt text for the image.

Save the alt text in a file called "${file.filename + ".txt"}".
`
```

::right::

<v-click>

## Deployed in GenAIScript Repo - Nightly Builds
![Screenshot of a GitHub Actions interface showing a list of workflow runs for a project named "genai alt text generator," with the most recent run highlighted and indicating a 'workflow_dispatch' event trigger.](/alt-text-deploy.png)

</v-click>
