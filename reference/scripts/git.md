
The `git` helper provides a thin wrapper around invoking the [git](https://git-scm.com/) executable for repository operations.

## Methods

### defaultBranch

Resolves the default branch, typically `main` or `master`, in the repository.

```typescript
const df = await git.defaultBranch();
```

### lastTag

Gets the last tag in the repository.

```typescript
const tag = await git.lastTag();
```

### branch

Gets the current branch of the repository.

```typescript
const branchName = await git.branch();
```

### exec

Executes a git command in the repository and returns the stdout.

```typescript
const output = await git.exec(['status']);
```

### listBranches

Lists the branches in the git repository.

```typescript
const branches = await git.listBranches();
```

### listFiles

Finds specific files in the git repository.

```typescript
const files = await git.listFiles('modified');
```

### diff

Gets the diff for the current repository state.

```typescript
const diffOutput = await git.diff({ staged: true });
```

### log

Lists the commits in the git repository.

```typescript
const commits = await git.log();
```

## Configuring Ignores

Since GenAIScript uses git, it already supports the `.gitignore` instructions. You can also provide additional repository-wide ignore through the `.gitignore.genai` file at the workspace root.

```txt title=".gitignore.genai"
**/genaiscript.d.ts
```
