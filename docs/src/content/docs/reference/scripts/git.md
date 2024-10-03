---
title: Git
description: git helpers
sidebar:
    order: 51
---

The `git` helper provides a thin wrapper around invoking the [git](https://git-scm.com/) executable.

## defaultBranch

Resolve the default branch, typically `main` or `master` in the repository.

```js
const df = await git.defaultBranch()
```

## Configuring ignores

Since GenAIScript uses git, it already support the `.gitignore` instructions. You can also provide additional
repository wide ignore through the `.gitignore.genai` file (on the workspace root).

```txt title=".gitignore.genai"
**/genaiscript.d.ts
```
