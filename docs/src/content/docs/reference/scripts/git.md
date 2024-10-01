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
