/**
 * Example script demonstrating the createCopilotPullRequest runtime helper
 */
system({
    title: "Create Copilot Pull Request Example",
    description: "Demonstrates how to create a pull request with copilot/ branch and assign to copilot padawan"
})

export default async function() {
    // Example usage of the createCopilotPullRequest function
    $`
# Create Copilot Pull Request Helper

This example demonstrates how to use the new \`createCopilotPullRequest\` runtime helper function.

## Basic Usage

\`\`\`javascript
// Create a pull request with a copilot/ branch and assign to copilot-swe-agent
const pr = await createCopilotPullRequest(
    "Fix issue with XYZ feature",
    "This PR addresses the bug in the XYZ feature by implementing proper error handling."
)

console.log("Created pull request:", pr.html_url)
\`\`\`

## Advanced Usage

\`\`\`javascript
// Create a pull request with custom options
const pr = await createCopilotPullRequest(
    "Implement new feature ABC",
    "This PR adds the new ABC feature as requested in the issue.",
    {
        branchSuffix: "feature-abc-implementation",
        baseBranch: "dev",
        assignToCopilot: true,
        copilotUser: "copilot-swe-agent", 
        draft: true,
        labels: ["feature", "copilot"]
    }
)
\`\`\`

## Function Signature

\`\`\`typescript
createCopilotPullRequest(
  title: string,
  body?: string, 
  options?: {
    branchSuffix?: string;        // Defaults to timestamp
    baseBranch?: string;          // Defaults to repository default branch
    assignToCopilot?: boolean;    // Defaults to true
    copilotUser?: string;         // Defaults to "copilot-swe-agent"
    draft?: boolean;              // Defaults to false
    labels?: string[];            // Additional labels for the PR
  }
): Promise<GitHubPullRequest>
\`\`\`

## How it works

1. **Branch Creation**: Creates a new branch with name starting with "copilot/"
2. **Pull Request**: Creates a new pull request from the copilot branch
3. **Assignment**: Automatically assigns the PR to the specified copilot user (default: copilot-swe-agent)
4. **Labels**: Applies any specified labels to the pull request

## Direct GitHub API Usage

You can also use the underlying GitHub API methods directly:

\`\`\`javascript
// Create pull request using github.createPullRequest
const pr = await github.createPullRequest({
    title: "My Feature PR",
    body: "Description of the changes",
    head: "copilot/my-feature-branch",
    base: "main",
    assignees: ["copilot-swe-agent"],
    labels: ["enhancement"]
})

// Then assign to copilot bot
await github.assignIssueToBot(pr.number, { bot: "copilot-swe-agent" })
\`\`\`

The runtime helper simplifies this workflow by:
- Automatically generating copilot/ branch names
- Handling the assignment to copilot users
- Providing sensible defaults for common use cases
`

    // Test if the function is available
    if (typeof createCopilotPullRequest === 'function') {
        $`✅ **createCopilotPullRequest is available and ready to use!**`
    } else {
        $`❌ createCopilotPullRequest function is not available`
    }

    if (typeof github?.createPullRequest === 'function') {
        $`✅ **github.createPullRequest method is available!**`
    } else {
        $`❌ github.createPullRequest method is not available`
    }
}