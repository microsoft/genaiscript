---
title: Files
sidebar:
    order: 13
---

All files are resolved relative to the current workspace project folder.

## Read File (`readFile`)

Reads the content of a local text file.

```ts
const content = await readFile("/README.md")
defFile("README", content)
```

## paths

The `paths` object contains helper methods to manipulate file names.

## fetchText

Use `fetchText` to issue GET requests and download text from the internet.

```ts
const { text, file } = await fetchText("https://....")
if (text) $`And also ${text}`

def("FILE", file)
```

fetchText will also resolve the contents of file in the current workspace if the url is a relative path.

```ts
const { file } = await fetchText("README.md")
def("README", file)
```
