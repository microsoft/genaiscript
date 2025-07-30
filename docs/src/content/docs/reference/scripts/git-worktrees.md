---
title: Git Worktrees
description: Git worktree support for managing multiple working directories
sidebar:
  order: 52
hero:
  image:
    alt:
      An 8-bit style, two-dimensional icon featuring multiple branching
      directories representing git worktrees, with geometric nodes and
      connecting lines to show relationships between working trees. Includes
      small folder icons with different branch symbols, a pull request icon,
      and directional arrows indicating workflow. The artwork uses five solid
      corporate colors in a flat, minimalist design with no background or
      gradients, created for a 128x128 size.
    file: ./git-worktrees.png
---

The git worktree functionality allows you to check out multiple branches of a repository in separate working directories simultaneously. This is particularly useful for:

- Working on multiple features or branches concurrently
- Reviewing pull requests without switching contexts
- Running tests on different branches
- Comparing implementations across branches

## Methods

### listWorktrees

Lists all existing worktrees in the repository with their metadata.

```typescript
const worktrees = await git.listWorktrees();
console.log(worktrees);
// [
//   {
//     path: "/path/to/main",
//     branch: "main",
//     head: "abc123def456",
//     bare: false,
//     detached: false
//   },
//   {
//     path: "/path/to/feature",
//     branch: "feature/new-api", 
//     head: "def456abc123",
//     bare: false,
//     detached: false
//   }
// ]
```

**Returns:** `Promise<GitWorktree[]>`

Each `GitWorktree` object contains:
- `path` - Absolute path to the worktree directory
- `branch` - Branch name (if on a branch)
- `head` - Current commit SHA
- `bare?` - Whether the worktree is bare (no working directory)
- `detached?` - Whether HEAD is detached (not on a branch)

### addWorktree

Creates a new worktree at the specified path and returns a Git client for that worktree.

```typescript
// Create worktree from existing branch
const featureGit = await git.addWorktree("./feature-workspace", "feature/new-api");

// Create worktree with new branch
const newFeatureGit = await git.addWorktree("./new-feature", "main", {
  branch: "feature/awesome-feature"
});

// Create detached worktree at specific commit
const commitGit = await git.addWorktree("./commit-review", "abc123", {
  detach: true
});
```

**Parameters:**
- `path: string` - Path where the worktree should be created
- `commitish?: string` - Branch, tag, or commit to check out (defaults to HEAD)
- `options?: GitWorktreeAddOptions` - Additional options

**Options (`GitWorktreeAddOptions`):**
- `branch?: string` - Create a new branch with this name
- `force?: boolean` - Force creation even if target exists
- `checkout?: boolean` - Whether to checkout files (default: true)
- `orphan?: boolean` - Create an orphan branch (no commit history)
- `detach?: boolean` - Detach HEAD at the specified commit

**Returns:** `Promise<Git>` - A Git client instance for the new worktree

### removeWorktree

Removes an existing worktree and cleans up its administrative files.

```typescript
// Remove worktree (fails if there are uncommitted changes)
await git.removeWorktree("./feature-workspace");

// Force remove worktree (removes even with uncommitted changes)
await git.removeWorktree("./feature-workspace", { force: true });
```

**Parameters:**
- `path: string` - Path to the worktree to remove
- `options?: { force?: boolean }` - Whether to force removal

## GitHub Integration

### addWorktreeForPullRequest

Creates a worktree specifically for reviewing or working on a GitHub pull request. This method automatically fetches the PR branch and sets up the worktree.

```typescript
// Create worktree for PR #123
const prGit = await github.addWorktreeForPullRequest(123);

// Create worktree at specific path
const prGit = await github.addWorktreeForPullRequest(456, "./pr-456-review");

// Create worktree with additional options
const prGit = await github.addWorktreeForPullRequest(789, "./pr-789", {
  checkout: false, // Don't checkout files initially
  force: true      // Force creation if path exists
});
```

**Parameters:**
- `pullNumber: number | string` - Pull request number
- `path?: string` - Path for the worktree (defaults to `worktree-pr-{number}`)
- `options?: GitWorktreeAddOptions` - Additional worktree options

**Returns:** `Promise<Git>` - A Git client instance for the PR worktree

This method:
1. Fetches the pull request details from GitHub
2. Attempts to fetch the PR branch locally
3. Creates a worktree with the PR branch
4. Returns a Git client for the new worktree

## Usage Examples

### Multi-branch Development

```typescript
// List current worktrees
const existing = await git.listWorktrees();
console.log(`Found ${existing.length} existing worktrees`);

// Create worktrees for different features
const mainGit = git; // Current repository
const featureGit = await git.addWorktree("../feature-a", "feature/feature-a");
const bugfixGit = await git.addWorktree("../hotfix", "main", {
  branch: "hotfix/critical-bug"
});

// Work in different contexts
const mainFiles = await mainGit.listFiles();
const featureFiles = await featureGit.listFiles();

// Clean up when done
await git.removeWorktree("../feature-a");
await git.removeWorktree("../hotfix");
```

### Pull Request Review Workflow

```typescript
// Create worktree for PR review
const prGit = await github.addWorktreeForPullRequest(123, "./pr-review");

// Check the PR's changed files
const changedFiles = await prGit.changedFiles();
console.log("Files changed in PR:", changedFiles);

// Run tests in the PR context
const testFiles = await prGit.listFiles("**/*.test.js");

// Get diff to understand changes
const diff = await prGit.diff({ base: "main" });

// Clean up after review
await git.removeWorktree("./pr-review");
```

### Parallel Development

```typescript
// Set up multiple worktrees for parallel work
const worktrees = await Promise.all([
  git.addWorktree("./feature-1", "feature/authentication"),
  git.addWorktree("./feature-2", "feature/api-endpoints"), 
  git.addWorktree("./testing", "main", { branch: "testing/integration" })
]);

// Each worktree can be used independently
for (const [index, worktreeGit] of worktrees.entries()) {
  const branch = await worktreeGit.branch();
  const status = await worktreeGit.exec(["status", "--porcelain"]);
  console.log(`Worktree ${index + 1} (${branch}): ${status ? 'has changes' : 'clean'}`);
}
```

## Best Practices

### Naming Conventions

Use descriptive paths that indicate the purpose:

```typescript
// Good: Clear purpose and context
await git.addWorktree("./pr-123-review", "main");
await git.addWorktree("./feature-auth", "feature/authentication");
await git.addWorktree("./hotfix-v1.2.3", "v1.2.2", { branch: "hotfix/v1.2.3" });

// Avoid: Generic or unclear names
await git.addWorktree("./temp", "some-branch");
await git.addWorktree("./test", "main");
```

### Resource Management

Always clean up worktrees when finished:

```typescript
try {
  const prGit = await github.addWorktreeForPullRequest(123);
  // Do work with the PR
  await processFiles(prGit);
} finally {
  // Clean up even if work fails
  await git.removeWorktree("./worktree-pr-123");
}
```

### Checking Existing Worktrees

Before creating new worktrees, check what already exists:

```typescript
const existing = await git.listWorktrees();
const prWorktree = existing.find(w => w.path.includes("pr-123"));

if (prWorktree) {
  console.log(`PR 123 worktree already exists at ${prWorktree.path}`);
  // Use existing worktree
  const prGit = git.client(prWorktree.path);
} else {
  // Create new worktree
  const prGit = await github.addWorktreeForPullRequest(123);
}
```

## Notes

- Worktrees share the same Git history and objects, saving disk space compared to separate clones
- Each worktree maintains its own index and working directory state
- You cannot check out the same branch in multiple worktrees simultaneously
- Administrative files are stored in the main repository's `.git/worktrees/` directory
- Worktrees are automatically removed from Git's records when their directories are deleted