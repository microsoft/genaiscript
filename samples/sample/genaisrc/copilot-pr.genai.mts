script({
    title: "Create Copilot Pull Request",
    description: "Simple example showing how to create pull requests with github.createCopilotPullRequest",
    model: "large"
})

// Simple example of creating a copilot pull request
const pr = await github.createCopilotPullRequest(
    "Fix example issue",
    "This PR demonstrates the createCopilotPullRequest method."
)

console.log(`Created PR: ${pr.html_url}`)

// Example with custom options
const advancedPr = await github.createCopilotPullRequest(
    "Add new feature",
    "This PR adds a new feature with custom configuration.",
    {
        branchSuffix: "new-feature",
        branchPrefix: "feature/",
        draft: true,
        labels: ["enhancement", "needs-review"]
    }
)

console.log(`Created advanced PR: ${advancedPr.html_url}`)