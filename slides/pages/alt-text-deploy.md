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
![The image displays a user interface of a software workflow system, showing a list of workflow runs for a project named "genai alt text generator." The list includes various entries with details such as the event type, status, branch, and actor. The most recent entry at the top indicates that the workflow has a 'workflow_dispatch' event trigger, while the entries below show completed runs marked with a green checkmark, their respective durations, and the branch name 'main.' There is also a button labeled "Run workflow" in the top right of the list. The interface appears to be part of a development or automation tool, possibly a continuous integration or continuous deployment service.](/alt-text-deploy.png)

</v-click>
