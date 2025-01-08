---
title: Git
description: Git utilities for repository operations
sidebar:
    order: 51
---

The `git` helper provides a thin wrapper around invoking the [git](https://git-scm.com/) executable for repository operations.

## Methods

### defaultBranch

Resolves the default branch, typically `main` or `master`, in the repository.

```typescript
const df = await git.defaultBranch()
```

### lastTag

Gets the last tag in the repository.

```typescript
const tag = await git.lastTag()
```

### branch

Gets the current branch of the repository.

```typescript
const branchName = await git.branch()
```

### exec

Executes a git command in the repository and returns the stdout.

```typescript
const output = await git.exec(["status"])
```

### listBranches

Lists the branches in the git repository.

```typescript
const branches = await git.listBranches()
```

### listFiles

Finds specific files in the git repository.

```typescript
const files = await git.listFiles("modified")
```

### diff

Gets the diff for the current repository state.

```typescript
const diffOutput = await git.diff({ staged: true })
```

### log

Lists the commits in the git repository.

```typescript
const commits = await git.log()
```

## Configuring Ignores

Since GenAIScript uses git, it already supports the `.gitignore` instructions. You can also provide additional repository-wide ignore through the `.gitignore.genai` file at the workspace root.

```txt title=".gitignore.genai"
**/genaiscript.d.ts
```

## Shallow clones

You can create cached shallow clones of repositories to work on multiple repositories.
The `shallowClone` method return a `git` client instance.

The clones are created under the `.genaiscript/git/...` directory and are cached based
on the `repository/branch/commit` information.

```js
const clone = await git.shallowClone("microsoft/genaiscript")
```

You can provide options to force the cloning
and/or running the `install` command after cloning.

```js
const clone = await git.shallowClone("microsoft/genaiscript", {
    force: true,
    install: true,
})
```

## Git in other repositories

Use `git.client` to open a git client on a different working directory. This allows you to run git commands on a different repository.

```js
const other = git.client("/path/to/other/repo")
const branch = await other.branch()
```
