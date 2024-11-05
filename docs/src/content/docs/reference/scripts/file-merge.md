---
title: File Merge
description: Customize file merging in scripts with defFileMerge function to handle different file formats and merging strategies.
keywords: file merging, custom merge, defFileMerge, script customization, content appending
sidebar:
    order: 11
---

The `defFileMerge` function allows to register a custom callback to override the default file merge behavior.
This can be useful to merge files in a different way than the default one, for example to merge files in a different format than the default one.

The function is called for all files; return the merged content or `undefined` is skipped.

```js
defFileMerge((filename, label, before, generated) => {
    ...
})
```

You can define multiple file merge callbacks, they will be executed in order of registration.

## Example: content appender

The callback below appends the content in generated `.txt` files.

```js
// append generated content
defFileMerge((filename, label, before, generated) => {
    // only merge .txt files
    if (!/\.txt$/i.test(filename)) return undefined
    // if content already existing, append generated content
    if (before) return `${before}\n${generated}`
    // otherwise return generated content
    else return generated
})
```
