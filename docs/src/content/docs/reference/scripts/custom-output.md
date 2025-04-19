---
title: Custom Output
description: Learn how to use the defOutputProcessor function for custom file
  processing in script generation.
keywords: custom output, defOutputProcessor, file processing, script generation,
  post processing
sidebar:
  order: 12
hero:
  image:
    alt: A minimalistic 8-bit style image depicts a stylized computer file with a
      glowing gear symbol and an arrow, suggesting file processing or
      modification. Nearby, a trash can has small colored documents hovering
      above it, representing files being cleaned or deleted. The image uses five
      flat colors, geometric forms, and has no background, text, people,
      shadows, or gradients, maintaining a clean, corporate-friendly look in a
      128x128 pixel format.
    file: ./custom-output.png

---

The `defOutputProcessor` function registers a callback to perform custom processing of the LLM output at the end of the generation process. This function allows the creation of new files or modification of existing ones.

:::caution

This feature is experimental and may change in the future.

:::

```js
// compute a filepath
const output = path.join(path.dirname(env.spec), "output.txt")
// post processing
defOutputProcessor(output => {
    return {
        files: [
            // emit entire content to a specific file
            [output]: output.text
        ]
    }
})
```

## Cleaning generated files

This example clears the `fileEdits` object, which contains the parsed file updates.

```js
defOutputProcessor((output) => {
    // clear out any parsed content
    for (const k of Object.keys(output.fileEdits)) {
        delete output.fileEdits[k]
    }
})
```
