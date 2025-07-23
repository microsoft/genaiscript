// Example usage of git worktree functionality
script({ model: "echo", title: "Git Worktree Example" })

console.log("# Git Worktree Operations")

// List existing worktrees
console.log("## Listing Worktrees")
try {
    const worktrees = await git.listWorktrees()
    console.log("Current worktrees:")
    for (const worktree of worktrees) {
        console.log(`- Path: ${worktree.path}`)
        console.log(`  Branch: ${worktree.branch}`)
        console.log(`  SHA: ${worktree.sha}`)
        if (worktree.locked) {
            console.log(`  Status: LOCKED${worktree.lockReason ? ` (${worktree.lockReason})` : ''}`)
        }
        if (worktree.detached) {
            console.log(`  Status: DETACHED`)
        }
        console.log()
    }
} catch (error) {
    console.log("Error listing worktrees:", error.message)
}

// Example of how to use other worktree operations
console.log("## Worktree Management Commands")
console.log(`
Available git worktree operations:

1. **List worktrees**: \`git.listWorktrees()\`
2. **Add worktree**: \`git.addWorktree(path, branch, options)\`
3. **Remove worktree**: \`git.removeWorktree(path, options)\`
4. **Move worktree**: \`git.moveWorktree(currentPath, newPath)\`
5. **Lock worktree**: \`git.lockWorktree(path, reason)\`
6. **Unlock worktree**: \`git.unlockWorktree(path)\`
7. **Prune worktrees**: \`git.pruneWorktrees(options)\`

### GitHub Client Worktree Operations

The GitHub client also supports worktree operations:
- \`github.listWorktrees()\`
- \`github.addWorktree(path, branch, options)\`
- \`github.removeWorktree(path, options)\`
- \`github.moveWorktree(currentPath, newPath)\`
- \`github.lockWorktree(path, reason)\`
- \`github.unlockWorktree(path)\`
- \`github.pruneWorktrees(options)\`

**Note**: GitHub client worktree operations require local git repository access.
`)

// Demonstrate typical usage patterns
console.log("## Typical Usage Patterns")
console.log(`
\`\`\`typescript
// Create a new worktree for feature development
const newWorktree = await git.addWorktree("../feature-branch", "feature/new-feature", {
    branch: "feature/new-feature", // Create new branch
    force: false
})

// Work in the worktree...

// When done, remove the worktree
await git.removeWorktree("../feature-branch")

// Or lock a worktree to prevent accidental removal
await git.lockWorktree("../important-work", "Long-running experiment")

// List all worktrees to see status
const allWorktrees = await git.listWorktrees()
console.log(allWorktrees)

// Clean up old worktrees
const prunedWorktrees = await git.pruneWorktrees({ dryRun: true })
console.log("Would prune:", prunedWorktrees)
\`\`\`
`)