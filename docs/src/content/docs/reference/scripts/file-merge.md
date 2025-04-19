---
title: File Merge
description: Customize file merging in scripts with defFileMerge function to
  handle different file formats and merging strategies.
keywords: file merging, custom merge, defFileMerge, script customization,
  content appending
sidebar:
  order: 11
hero:
  image:
    alt: An 8-bit style icon shows a computer file with a folded corner, split into
      blue on one side and green on the other, representing "before" and
      "generated" document icons. An orange arrow connects both halves into one
      merged file with a bold plus sign at the center. The design uses five flat
      colors, simple geometric shapes, and no background.
    file: ./file-merge.png

---

The `defFileMerge` function allows you to register a custom callback to override the default file merge behavior.
This can be useful for merging files in a different way than the default, for example, to merge files in a different format.

The function is called for all files; return the merged content or `undefined` to skip.

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
